import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import express, { type Request, type Response } from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import { Transform } from "stream";
import {
  S3Client,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import pkg, { type PoolClient } from "pg";
import { Queue, Worker, QueueEvents, Job } from "bullmq";
import IORedis from "ioredis";
import { auth } from "~/lib/auth.server";
import {
  capExportDimensions,
  clampExportCrf,
  getRemotionRenderTuning,
  parseRenderJobReturn,
  sanitizeExportFileName,
  X264_PRESETS,
  type ExportResolutionPreset,
  type X264Preset,
} from "~/lib/render-settings";
import { computeExportFingerprint } from "~/lib/render-fingerprint";

const execFileAsync = promisify(execFile);
const { Pool } = pkg;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(scriptDir, "../../.env");
dotenv.config({ path: envPath });

// ─── R2 client (S3-compatible) ───────────────────────────────────────────────

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID!.trim()}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ASSETS_BUCKET = process.env.R2_ASSETS_BUCKET!;
const RENDERS_BUCKET = process.env.R2_RENDERS_BUCKET!;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ASSET_UPLOAD_BYTES = 500 * 1024 * 1024;

function getAssetUrl(assetId: string): string {
  return `/renderer/assets/${assetId}/file`;
}

// ─── Database pool ────────────────────────────────────────────────────────────

const db = new Pool({
  connectionString: process.env.DATABASE_URL!.trim(),
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// ─── Remotion bundle ──────────────────────────────────────────────────────────

const compositionId = "TimelineComposition";

const bundleLocation = await bundle({
  entryPoint: path.resolve("./app/videorender/index.ts"),
  webpackOverride: (config) => config,
});

// Ensure output directory exists for temporary render files
if (!fs.existsSync("out")) {
  fs.mkdirSync("out", { recursive: true });
}

// ─── BullMQ render queue ──────────────────────────────────────────────────────

function createRedisConnection() {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

interface RenderJobData {
  userId: string;
  projectId: string;
  renderJobId: string;
  contentFingerprint: string;
  codec: "h264" | "h265" | "vp9";
  crf: number;
  resolutionPreset: ExportResolutionPreset;
  outputFileName: string;
  advancedMode: boolean;
  jpegQuality?: number;
  x264Preset?: X264Preset;
  muted?: boolean;
  inputProps: {
    timelineData: unknown;
    durationInFrames: number;
    compositionWidth: number;
    compositionHeight: number;
    getPixelsPerSecond: number;
    isRendering: boolean;
  };
}

function extForCodec(codec: string) {
  return codec === "vp9" ? "webm" : "mp4";
}
function mimeForCodec(codec: string) {
  return codec === "vp9" ? "video/webm" : "video/mp4";
}

interface CachedRenderRow {
  id: string;
  file_name: string;
  r2_video_key: string;
  r2_thumb_key: string | null;
  codec: string;
}

async function ensureProjectRendersTable(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_renders (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id             TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      render_job_id       UUID NOT NULL,
      content_fingerprint TEXT NOT NULL,
      file_name           TEXT NOT NULL,
      codec               TEXT NOT NULL,
      width               INT NOT NULL,
      height              INT NOT NULL,
      duration_frames     INT,
      crf                 INT,
      resolution_preset   TEXT,
      r2_video_key        TEXT NOT NULL,
      r2_thumb_key        TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_project_renders_project_created
      ON project_renders(project_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_project_renders_fingerprint
      ON project_renders(project_id, user_id, content_fingerprint, created_at DESC);
  `);
}

async function assertProjectOwned(userId: string, projectId: string): Promise<boolean> {
  const { rows } = await db.query(
    `SELECT id FROM projects WHERE id = $1::uuid AND user_id = $2`,
    [projectId, userId],
  );
  return rows.length > 0;
}

async function findCachedRender(
  projectId: string,
  userId: string,
  fingerprint: string,
): Promise<CachedRenderRow | null> {
  const { rows } = await db.query(
    `SELECT id, file_name, r2_video_key, r2_thumb_key, codec
     FROM project_renders
     WHERE project_id = $1::uuid AND user_id = $2 AND content_fingerprint = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [projectId, userId, fingerprint],
  );
  return (rows[0] as CachedRenderRow | undefined) ?? null;
}

async function signRenderAssetUrls(
  row: Pick<CachedRenderRow, "file_name" | "r2_video_key" | "r2_thumb_key" | "codec">,
): Promise<{ downloadUrl: string; previewUrl: string; thumbnailUrl: string | null }> {
  const safeName = row.file_name.replace(/"/g, "");
  const downloadUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: RENDERS_BUCKET,
      Key: row.r2_video_key,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    }),
    { expiresIn: 3600 },
  );
  const previewUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: RENDERS_BUCKET,
      Key: row.r2_video_key,
      ResponseContentDisposition: `inline; filename="${safeName}"`,
    }),
    { expiresIn: 3600 },
  );
  let thumbnailUrl: string | null = null;
  if (row.r2_thumb_key) {
    thumbnailUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: RENDERS_BUCKET, Key: row.r2_thumb_key }),
      { expiresIn: 3600 },
    );
  }
  return { downloadUrl, previewUrl, thumbnailUrl };
}

function isUserOwnedRenderKey(key: string, userId: string): boolean {
  const prefix = `${userId}/`;
  return key.startsWith(prefix) && !key.includes("..") && key.length > prefix.length;
}

async function deleteRenderR2Objects(
  userId: string,
  videoKey: string,
  thumbKey: string | null,
): Promise<void> {
  if (!RENDERS_BUCKET) {
    throw new Error("Renders bucket not configured");
  }
  if (!isUserOwnedRenderKey(videoKey, userId)) {
    throw new Error("Invalid render video key");
  }
  await r2.send(new DeleteObjectCommand({ Bucket: RENDERS_BUCKET, Key: videoKey }));
  if (thumbKey) {
    if (!isUserOwnedRenderKey(thumbKey, userId)) {
      console.warn(`Skipping invalid thumb key on render delete: ${thumbKey}`);
    } else {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: RENDERS_BUCKET, Key: thumbKey }));
      } catch (err) {
        console.warn(`Failed to delete render thumbnail ${thumbKey}:`, err);
      }
    }
  }
}

async function extractThumbnail(videoPath: string, thumbPath: string): Promise<boolean> {
  try {
    await execFileAsync(
      "npx",
      [
        "remotion",
        "ffmpeg",
        "-y",
        "-ss",
        "0",
        "-i",
        videoPath,
        "-frames:v",
        "1",
        "-vf",
        "scale=320:-2",
        "-q:v",
        "5",
        thumbPath,
      ],
      { timeout: 120_000, cwd: process.cwd() },
    );
    return fs.existsSync(thumbPath);
  } catch (err) {
    console.warn("Thumbnail extraction failed:", err);
    return false;
  }
}

const renderQueue = new Queue<RenderJobData>("renders", { connection: createRedisConnection() });
const renderQueueEvents = new QueueEvents("renders", { connection: createRedisConnection() });

const renderWorker = new Worker<
  RenderJobData,
  { downloadUrl: string; fileName: string; renderId: string }
>(
  "renders",
  async (job) => {
    const {
      userId,
      projectId,
      renderJobId,
      contentFingerprint,
      inputProps: rawInputProps,
      codec = "h264",
      crf = 28,
      resolutionPreset = "1080p",
      outputFileName,
      advancedMode = false,
      jpegQuality: jpegQualityOverride,
      x264Preset: x264PresetOverride,
      muted = false,
    } = job.data;
    const ext = extForCodec(codec);
    const downloadFileName = sanitizeExportFileName(outputFileName, ext);
    const localOutputPath = `out/${renderJobId}.${ext}`;
    const effectiveCrf = clampExportCrf(crf, advancedMode);

    const capped = capExportDimensions(
      rawInputProps.compositionWidth,
      rawInputProps.compositionHeight,
      resolutionPreset,
    );
    if (capped.scaled) {
      console.log(
        `📐 Export resolution capped to ${capped.width}×${capped.height} (preset: ${resolutionPreset})`,
      );
    }
    const inputProps = {
      ...rawInputProps,
      compositionWidth: capped.width,
      compositionHeight: capped.height,
    };
    const tuning = getRemotionRenderTuning(capped.width, capped.height);
    if (
      typeof jpegQualityOverride === "number" &&
      jpegQualityOverride >= 60 &&
      jpegQualityOverride <= 100
    ) {
      tuning.jpegQuality = Math.round(jpegQualityOverride);
    }
    if (
      codec === "h264" &&
      x264PresetOverride &&
      (X264_PRESETS as readonly string[]).includes(x264PresetOverride)
    ) {
      tuning.x264Preset = x264PresetOverride;
    }

    // Headless Chrome launched by Remotion loads from Remotion's own bundle
    // server (e.g. port 3001), not from this Express app. Relative asset URLs
    // like /renderer/assets/{id}/file would resolve against that bundle server
    // and 404. Rewrite them to absolute loopback URLs so Chrome fetches from
    // this Express app regardless of environment (local dev or Docker).
    const rendererPort = process.env.PORT ?? "8000";
    const absInputProps = {
      ...inputProps,
      timelineData: JSON.parse(
        JSON.stringify(inputProps.timelineData).replace(
          /\/renderer\/assets\//g,
          `http://127.0.0.1:${rendererPort}/renderer/assets/`,
        ),
      ) as unknown,
    };

    await job.updateProgress(5);

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: absInputProps,
    });

    await job.updateProgress(10);

    let lastReportedProgress = 10;
    const useCrf = effectiveCrf > 0 && effectiveCrf <= 51 ? effectiveCrf : undefined;

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec,
      outputLocation: localOutputPath,
      inputProps: absInputProps,
      concurrency: tuning.concurrency,
      disallowParallelEncoding: tuning.disallowParallelEncoding,
      offthreadVideoCacheSizeInBytes: tuning.offthreadVideoCacheSizeInBytes,
      jpegQuality: tuning.jpegQuality,
      imageFormat: "jpeg",
      crf: useCrf,
      x264Preset: codec === "h264" ? tuning.x264Preset : undefined,
      colorSpace: "bt709",
      muted,
      logLevel: "info",
      onProgress: ({ progress }) => {
        const percent = Math.round(10 + progress * 80);
        if (percent >= lastReportedProgress + 2) {
          lastReportedProgress = percent;
          void job.updateProgress(percent);
        }
      },
      ffmpegOverride:
        codec === "h265"
          ? ({ args }) => [...args, "-tag:v", "hvc1"]
          : undefined,
      timeoutInMilliseconds: 900000,
    });

    console.log("✅ Render completed — uploading to R2");
    await job.updateProgress(92);

    const renderKey = `${userId}/${renderJobId}.${ext}`;
    const fileStream = fs.createReadStream(localOutputPath);
    const upload = new Upload({
      client: r2,
      params: {
        Bucket: RENDERS_BUCKET,
        Key: renderKey,
        Body: fileStream,
        ContentType: mimeForCodec(codec),
      },
      queueSize: 4,
      partSize: 10 * 1024 * 1024,
    });
    await upload.done();

    await job.updateProgress(94);

    const thumbPath = `out/${renderJobId}-thumb.jpg`;
    let r2ThumbKey: string | null = null;
    if (await extractThumbnail(localOutputPath, thumbPath)) {
      r2ThumbKey = `${userId}/thumbs/${renderJobId}.jpg`;
      const thumbStream = fs.createReadStream(thumbPath);
      const thumbUpload = new Upload({
        client: r2,
        params: {
          Bucket: RENDERS_BUCKET,
          Key: r2ThumbKey,
          Body: thumbStream,
          ContentType: "image/jpeg",
        },
      });
      await thumbUpload.done();
      try {
        fs.unlinkSync(thumbPath);
      } catch {
        /* ignore */
      }
    }

    await job.updateProgress(97);

    const { rows: insertRows } = await db.query(
      `INSERT INTO project_renders (
         project_id, user_id, render_job_id, content_fingerprint, file_name, codec,
         width, height, duration_frames, crf, resolution_preset, r2_video_key, r2_thumb_key
       ) VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        projectId,
        userId,
        renderJobId,
        contentFingerprint,
        downloadFileName,
        codec,
        capped.width,
        capped.height,
        rawInputProps.durationInFrames,
        effectiveCrf,
        resolutionPreset,
        renderKey,
        r2ThumbKey,
      ],
    );
    const renderId = String(insertRows[0].id);

    const { downloadUrl } = await signRenderAssetUrls({
      file_name: downloadFileName,
      r2_video_key: renderKey,
      r2_thumb_key: r2ThumbKey,
      codec,
    });

    try {
      fs.unlinkSync(localOutputPath);
    } catch {
      /* ignore */
    }

    console.log(`📦 Render uploaded: ${renderKey}`);
    return { downloadUrl, fileName: downloadFileName, renderId };
  },
  {
    connection: createRedisConnection(),
    concurrency: 1,
  },
);

renderWorker.on("failed", (job, err) => {
  console.error(`❌ Render job ${job?.id} failed:`, err.message);
  const renderJobId = job?.data?.renderJobId;
  if (renderJobId) {
    try {
      const p = `out/${renderJobId}.mp4`;
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {}
  }
});

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  return session?.user?.id ?? null;
}

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use(cors());

// ─── UUID helper ──────────────────────────────────────────────────────────────

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Renderer-internal asset proxy (no auth — called by headless Chrome) ─────
// Headless Chrome launched by Remotion has no session cookies. This route lets
// it fetch assets during rendering. The path matches `mediaUrlLocal` values
// stored as `/renderer/assets/{id}/file` in the timeline JSON.

app.get("/renderer/assets/:assetId/file", async (req: Request, res: Response): Promise<void> => {
  const { assetId } = req.params;
  if (!UUID_PATTERN.test(assetId)) {
    res.status(400).end();
    return;
  }
  try {
    const { rows } = await db.query<{ r2_key: string; mime_type: string }>(
      `SELECT r2_key, mime_type FROM assets WHERE id = $1 AND deleted_at IS NULL AND status = 'ready' LIMIT 1`,
      [assetId],
    );
    if (rows.length === 0) {
      res.status(404).end();
      return;
    }
    const object = await r2.send(new GetObjectCommand({ Bucket: ASSETS_BUCKET, Key: rows[0].r2_key }));
    const body = object.Body as NodeJS.ReadableStream | undefined;
    if (!body || typeof (body as { pipe?: unknown }).pipe !== "function") {
      res.status(500).end();
      return;
    }
    res.setHeader("Content-Type", object.ContentType || rows[0].mime_type || "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=300");
    if (typeof object.ContentLength === "number") res.setHeader("Content-Length", String(object.ContentLength));
    body.on("error", () => { if (!res.headersSent) res.status(500).end(); else res.end(); });
    body.pipe(res);
  } catch (err) {
    console.error("renderer asset proxy error:", err);
    res.status(500).end();
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  const used = process.memoryUsage();
  res.json({
    status: "ok",
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    },
    uptime: `${Math.round(process.uptime())} seconds`,
  });
});

app.get("/assets", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : null;
  if (projectId && !UUID_PATTERN.test(projectId)) {
    res.status(400).json({ error: "Invalid projectId" });
    return;
  }

  try {
    const { rows } = await db.query<{
      id: string;
      filename: string;
      media_type: string | null;
      mime_type: string;
      file_size: string | null;
      width: number | null;
      height: number | null;
      duration_seconds: number | null;
      created_at: Date | string;
    }>(
      `SELECT id, filename, media_type, mime_type, file_size, width, height, duration_seconds, created_at
         FROM assets
        WHERE user_id = $1
          AND deleted_at IS NULL
          AND status = 'ready'
          AND ($2::uuid IS NULL OR project_id = $2::uuid)
        ORDER BY created_at DESC`,
      [userId, projectId],
    );

    res.json({
      assets: rows.map((row) => ({
        id: row.id,
        filename: row.filename,
        mediaType: row.media_type,
        mimeType: row.mime_type,
        fileSize: row.file_size ? Number(row.file_size) : null,
        width: row.width,
        height: row.height,
        durationInSeconds: row.duration_seconds,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
        assetUrl: getAssetUrl(row.id),
      })),
    });
  } catch (err) {
    console.error("list assets error:", err);
    res.status(500).json({ error: "Failed to list assets" });
  }
});

app.get("/assets/:assetId/file", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { assetId } = req.params;
  try {
    const { rows } = await db.query<{ r2_key: string; mime_type: string }>(
      `SELECT r2_key, mime_type
         FROM assets
        WHERE id = $1
          AND user_id = $2
          AND deleted_at IS NULL
          AND status = 'ready'
        LIMIT 1`,
      [assetId, userId],
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    const r2Key = rows[0].r2_key;
    const mimeType = rows[0].mime_type || "application/octet-stream";
    const object = await r2.send(
      new GetObjectCommand({
        Bucket: ASSETS_BUCKET,
        Key: r2Key,
      }),
    );

    const body = object.Body as NodeJS.ReadableStream | undefined;
    if (!body || typeof (body as { pipe?: unknown }).pipe !== "function") {
      res.status(500).json({ error: "Invalid asset stream" });
      return;
    }

    res.setHeader("Content-Type", object.ContentType || mimeType);
    res.setHeader("Cache-Control", "private, max-age=60");
    if (typeof object.ContentLength === "number") {
      res.setHeader("Content-Length", String(object.ContentLength));
    }

    body.on("error", (streamErr) => {
      console.error("asset stream error:", streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: "Asset stream failed" });
      } else {
        res.end();
      }
    });

    body.pipe(res);
  } catch (err) {
    console.error("get asset file error:", err);
    res.status(500).json({ error: "Failed to fetch asset file" });
  }
});

// ─── POST /assets/initiate-upload ─────────────────────────────────────────────
// Dedup-aware upload initiation.
//
// If the content hash already exists and the R2 object is ready, we skip the
// upload entirely and create the per-user asset record pointing to the shared
// object (returns { alreadyExists: true, assetUrl }).
//
// If the hash is new (or a concurrent upload is in-progress), we upsert the
// r2_objects row, create the asset record, and then upload file bytes to this
// renderer service at /assets/upload/:assetId (same-origin, no browser→R2 CORS).

app.post("/assets/initiate-upload", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { assetId, filename, fileSize, mimeType, mediaType, contentHash, projectId } = req.body as {
    assetId: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    mediaType: string;
    contentHash: string; // SHA-256 hex from browser
    projectId?: string | null;
  };

  if (!assetId || !filename || !mimeType || !contentHash) {
    res.status(400).json({ error: "assetId, filename, mimeType, and contentHash are required" });
    return;
  }

  const ext = path.extname(filename).toLowerCase();
  // Content-addressed key — shared across all users with the same file
  const r2Key = `objects/${contentHash}${ext}`;
  try {
    // ── Dedup check ──────────────────────────────────────────────────────────
    // Upsert into r2_objects. If a row already exists with this hash, the
    // no-op UPDATE still triggers RETURNING so we get back the current status.
    const { rows: objRows } = await db.query<{ status: string }>(
      `INSERT INTO r2_objects (content_hash, r2_key, file_size, mime_type, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (content_hash)
         DO UPDATE SET content_hash = EXCLUDED.content_hash
       RETURNING status`,
      [contentHash, r2Key, fileSize || 0, mimeType],
    );

    const objectStatus = objRows[0]?.status ?? "pending";

    if (objectStatus === "ready") {
      // ── Fast-path: file already in R2 — create per-user asset record only ──
      await db.query(
        `INSERT INTO assets
           (id, user_id, project_id, content_hash, r2_key, filename, file_size,
            mime_type, media_type, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ready')
         ON CONFLICT (id) DO NOTHING`,
        [
          assetId,
          userId,
          projectId ?? null,
          contentHash,
          r2Key,
          filename,
          fileSize || null,
          mimeType,
          mediaType || null,
        ],
      );

      console.log(`⚡ Dedup hit: ${filename} (${contentHash.slice(0, 8)}…)`);
      res.json({ alreadyExists: true, assetId, assetUrl: getAssetUrl(assetId) });
      return;
    }

    // ── Normal path: create asset record in 'uploading' state ───────────────
    await db.query(
      `INSERT INTO assets
         (id, user_id, project_id, content_hash, r2_key, filename, file_size,
          mime_type, media_type, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'uploading')
       ON CONFLICT (id) DO UPDATE
         SET content_hash=$4, r2_key=$5, filename=$6, file_size=$7,
             mime_type=$8, media_type=$9, status='uploading'`,
      [assetId, userId, projectId ?? null, contentHash, r2Key, filename, fileSize || null, mimeType, mediaType || null],
    );

    console.log(`📤 Upload initiated: ${filename} → ${r2Key}`);
    res.json({ assetId, r2Key, assetUrl: getAssetUrl(assetId) });
  } catch (err) {
    console.error("initiate-upload error:", err);
    res.status(500).json({ error: "Failed to initiate upload" });
  }
});

// ─── PUT /assets/upload/:assetId ──────────────────────────────────────────────
// Receives raw bytes from browser and uploads to R2 server-side.
// This keeps browser traffic same-origin and avoids R2 CORS preflight failures.

app.put(
  "/assets/upload/:assetId",
  async (req: Request, res: Response): Promise<void> => {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { assetId } = req.params;
    if (!assetId) {
      res.status(400).json({ error: "assetId is required" });
      return;
    }
    const declaredLength = Number(req.headers["content-length"] || 0);
    if (declaredLength > MAX_ASSET_UPLOAD_BYTES) {
      res.status(413).json({ error: "File too large" });
      return;
    }

    try {
      const { rows } = await db.query<{ r2_key: string; mime_type: string; content_hash: string | null }>(
        `SELECT r2_key, mime_type, content_hash
           FROM assets
          WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL`,
        [assetId, userId],
      );

      if (rows.length === 0) {
        res.status(404).json({ error: "Asset not found" });
        return;
      }

      const r2Key = rows[0].r2_key;
      const fallbackMimeType = rows[0].mime_type || "application/octet-stream";
      const reqMimeType = req.headers["content-type"];
      const contentType = typeof reqMimeType === "string" ? reqMimeType : fallbackMimeType;
      let actualFileSize = 0;
      const sizeGuardStream = new Transform({
        transform(chunk, _encoding, callback) {
          const chunkSize = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
          actualFileSize += chunkSize;
          if (actualFileSize > MAX_ASSET_UPLOAD_BYTES) {
            callback(new Error("UPLOAD_TOO_LARGE"));
            return;
          }
          callback(null, chunk);
        },
      });

      req.on("aborted", () => {
        sizeGuardStream.destroy(new Error("UPLOAD_ABORTED"));
      });
      req.on("error", (streamErr) => {
        sizeGuardStream.destroy(streamErr);
      });
      req.pipe(sizeGuardStream);

      const upload = new Upload({
        client: r2,
        params: {
          Bucket: ASSETS_BUCKET,
          Key: r2Key,
          Body: sizeGuardStream,
          ContentType: contentType,
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024,
      });
      await upload.done();

      if (actualFileSize === 0) {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: ASSETS_BUCKET,
            Key: r2Key,
          }),
        );
        res.status(400).json({ error: "File body is required" });
        return;
      }
      await db.query(
        `UPDATE assets
            SET file_size = $3
          WHERE id = $1 AND user_id = $2`,
        [assetId, userId, actualFileSize],
      );
      if (rows[0].content_hash) {
        await db.query(
          `UPDATE r2_objects
              SET file_size = $2
            WHERE content_hash = $1`,
          [rows[0].content_hash, actualFileSize],
        );
      }

      res.json({ success: true });
    } catch (err) {
      if (err instanceof Error && err.message === "UPLOAD_TOO_LARGE") {
        res.status(413).json({ error: "File too large" });
        return;
      }
      console.error("upload-bytes error:", err);
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

// ─── POST /assets/complete-upload ─────────────────────────────────────────────
// Called after the browser PUT to R2 succeeds. Marks r2_objects as ready
// (idempotent — safe when two users upload the same hash concurrently) and
// finalises the per-user asset record.

app.post("/assets/complete-upload", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { assetId, width, height, durationInSeconds } = req.body as {
    assetId: string;
    width?: number;
    height?: number;
    durationInSeconds?: number;
  };

  if (!assetId) {
    res.status(400).json({ error: "assetId is required" });
    return;
  }

  try {
    const { rows: lookup } = await db.query(
      "SELECT r2_key, content_hash FROM assets WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL",
      [assetId, userId],
    );

    if (lookup.length === 0) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    const contentHash: string = lookup[0].content_hash;

    // Mark the shared R2 object as confirmed (idempotent — no-op if already ready)
    await db.query("UPDATE r2_objects SET status='ready' WHERE content_hash=$1 AND status='pending'", [contentHash]);

    const { rows } = await db.query(
      `UPDATE assets
          SET status='ready', width=$3, height=$4, duration_seconds=$5
        WHERE id=$1 AND user_id=$2
        RETURNING *`,
      [assetId, userId, width ?? null, height ?? null, durationInSeconds ?? null],
    );

    console.log(`✅ Upload complete: ${assetId}`);
    res.json({ asset: { ...rows[0], assetUrl: getAssetUrl(assetId) } });
  } catch (err) {
    console.error("complete-upload error:", err);
    res.status(500).json({ error: "Failed to complete upload" });
  }
});

app.get("/storage", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { rows } = await db.query<{ used_bytes: string }>(
      `SELECT COALESCE(SUM(file_size), 0)::bigint AS used_bytes
         FROM assets
        WHERE user_id = $1
          AND deleted_at IS NULL
          AND status = 'ready'`,
      [userId],
    );

    res.json({
      usedBytes: Number(rows[0]?.used_bytes ?? 0),
      limitBytes: 2 * 1024 * 1024 * 1024,
    });
  } catch (err) {
    console.error("storage error:", err);
    res.status(500).json({ error: "Failed to fetch storage info" });
  }
});

type AssetDeleteRow = {
  r2_key: string | null;
  content_hash: string | null;
  status: string;
};

async function shouldDeleteR2Object(client: PoolClient, row: AssetDeleteRow): Promise<boolean> {
  if (!row.r2_key || row.status !== "ready") return false;

  if (row.content_hash) {
    await client.query("SELECT 1 FROM r2_objects WHERE content_hash=$1 FOR UPDATE", [row.content_hash]);

    const { rows: refRows } = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM assets
        WHERE content_hash=$1 AND deleted_at IS NULL AND status='ready'`,
      [row.content_hash],
    );
    const remaining = parseInt(refRows[0]?.count ?? "0", 10);
    if (remaining === 0) {
      await client.query("DELETE FROM r2_objects WHERE content_hash=$1", [row.content_hash]);
      return true;
    }
    return false;
  }

  await client.query(
    `SELECT 1 FROM assets
      WHERE r2_key=$1 AND deleted_at IS NULL AND status='ready'
      FOR UPDATE`,
    [row.r2_key],
  );

  const { rows: directRefRows } = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM assets
      WHERE r2_key=$1 AND deleted_at IS NULL AND status='ready'`,
    [row.r2_key],
  );
  const remainingDirect = parseInt(directRefRows[0]?.count ?? "0", 10);
  return remainingDirect === 0;
}

app.delete("/projects/:projectId", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { projectId } = req.params;
  const client = await db.connect();
  const r2KeysToDelete = new Set<string>();

  try {
    await client.query("BEGIN");

    const { rows: projectRows } = await client.query("SELECT id FROM projects WHERE id=$1 AND user_id=$2 FOR UPDATE", [
      projectId,
      userId,
    ]);
    if (projectRows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const { rows: assetRows } = await client.query<AssetDeleteRow>(
      `SELECT r2_key, content_hash, status
         FROM assets
        WHERE project_id=$1 AND user_id=$2 AND deleted_at IS NULL
        FOR UPDATE`,
      [projectId, userId],
    );

    await client.query(
      `UPDATE assets
          SET deleted_at = now()
        WHERE project_id=$1 AND user_id=$2 AND deleted_at IS NULL`,
      [projectId, userId],
    );

    const handledHashes = new Set<string>();
    const handledDirectKeys = new Set<string>();

    for (const assetRow of assetRows) {
      if (!assetRow.r2_key || assetRow.status !== "ready") continue;

      if (assetRow.content_hash) {
        if (handledHashes.has(assetRow.content_hash)) continue;
        handledHashes.add(assetRow.content_hash);
      } else {
        if (handledDirectKeys.has(assetRow.r2_key)) continue;
        handledDirectKeys.add(assetRow.r2_key);
      }

      const deleteObject = await shouldDeleteR2Object(client, assetRow);
      if (deleteObject) {
        r2KeysToDelete.add(assetRow.r2_key);
      }
    }

    await client.query("DELETE FROM projects WHERE id=$1 AND user_id=$2", [projectId, userId]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("delete project error:", err);
    res.status(500).json({ error: "Failed to delete project" });
    return;
  } finally {
    client.release();
  }

  for (const r2Key of r2KeysToDelete) {
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: ASSETS_BUCKET, Key: r2Key }));
      console.log(`🗑️ R2 object removed after project delete: ${r2Key}`);
    } catch (r2Err) {
      console.warn(`⚠️ Failed to delete R2 object ${r2Key} after project delete:`, r2Err);
    }
  }

  res.status(204).send();
});

// ─── DELETE /assets/:assetId ──────────────────────────────────────────────────
// Reference-counted delete.
// - For deduped assets: object is deleted only when no active row references
//   the same content_hash.
// - For direct/copy assets (no content_hash): object is deleted only when no
//   active row references the same r2_key.

app.delete("/assets/:assetId", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { assetId } = req.params;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Fetch and lock the asset row
    const { rows } = await client.query<{ r2_key: string; content_hash: string | null; status: string }>(
      "SELECT r2_key, content_hash, status FROM assets WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL FOR UPDATE",
      [assetId, userId],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    const r2Key: string = rows[0].r2_key;
    const contentHash: string | null = rows[0].content_hash;
    const assetStatus: string = rows[0].status;

    // Soft-delete this user's asset record
    await client.query("UPDATE assets SET deleted_at=now() WHERE id=$1", [assetId]);

    const shouldDeleteObject = await shouldDeleteR2Object(client, {
      r2_key: r2Key,
      content_hash: contentHash,
      status: assetStatus,
    });

    await client.query("COMMIT");

    // Delete R2 object outside the transaction (network call should not hold a DB lock)
    if (shouldDeleteObject) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: ASSETS_BUCKET, Key: r2Key }));
        console.log(`🗑️ R2 object removed: ${r2Key}`);
      } catch (r2Err) {
        // Log but don't fail — DB is already consistent, orphaned R2 objects are benign
        console.warn(`⚠️ Failed to delete R2 object ${r2Key}:`, r2Err);
      }
    }

    console.log(`🗑️ Asset deleted: ${assetId}${shouldDeleteObject ? " (R2 object removed)" : " (shared, kept)"}`);
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("delete asset error:", err);
    res.status(500).json({ error: "Failed to delete asset" });
  } finally {
    client.release();
  }
});

// ─── POST /assets/:assetId/clone ──────────────────────────────────────────────
// Server-side R2 copy, used for audio splitting.

app.post("/assets/:assetId/clone", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { assetId } = req.params;
  const { suffix } = req.body as { suffix?: string };

  try {
    const { rows } = await db.query("SELECT * FROM assets WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL", [
      assetId,
      userId,
    ]);

    if (rows.length === 0) {
      res.status(404).json({ error: "Source asset not found" });
      return;
    }

    const source = rows[0];
    const sourceKey: string = source.r2_key;
    const ext = path.extname(sourceKey);
    const newAssetId = generateUUID();
    const newR2Key = `${userId}/${newAssetId}${ext}`;

    await r2.send(
      new CopyObjectCommand({
        CopySource: `${ASSETS_BUCKET}/${sourceKey}`,
        Bucket: ASSETS_BUCKET,
        Key: newR2Key,
      }),
    );

    const newFilename = suffix ? `${path.basename(source.filename, ext)} ${suffix}${ext}` : source.filename;

    const { rows: newRows } = await db.query(
      `INSERT INTO assets
         (id, user_id, project_id, r2_key, filename, file_size, mime_type,
          media_type, duration_seconds, width, height, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ready')
       RETURNING *`,
      [
        newAssetId,
        userId,
        source.project_id,
        newR2Key,
        newFilename,
        source.file_size,
        source.mime_type,
        source.media_type,
        source.duration_seconds,
        source.width,
        source.height,
      ],
    );
    // Note: cloned assets intentionally have no content_hash since they represent
    // a new physical object in R2 (e.g. audio extracted from video).

    console.log(`📋 Asset cloned: ${assetId} → ${newAssetId}`);
    res.json({ asset: { ...newRows[0], assetUrl: getAssetUrl(newAssetId) } });
  } catch (err) {
    console.error("clone asset error:", err);
    res.status(500).json({ error: "Failed to clone asset" });
  }
});

// ─── POST /render ──────────────────────────────────────────────────────────────
// Enqueues a render job and returns { jobId } immediately.
// Client opens GET /render/:jobId/events for SSE progress updates.

app.post("/render", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const projectId = typeof req.body.projectId === "string" ? req.body.projectId : "";
  if (!UUID_PATTERN.test(projectId)) {
    res.status(400).json({ error: "Valid projectId is required" });
    return;
  }
  if (!(await assertProjectOwned(userId, projectId))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const renderJobId = generateUUID();

  const VALID_CODECS = new Set(["h264", "h265", "vp9"]);
  const codec = VALID_CODECS.has(req.body.codec) ? req.body.codec : "h264";
  const advancedMode = req.body.advancedMode === true;
  const crf = typeof req.body.crf === "number"
    ? clampExportCrf(req.body.crf, advancedMode)
    : 28;
  const VALID_PRESETS = new Set(["1080p", "720p", "source", "4k"]);
  const resolutionPreset: ExportResolutionPreset = VALID_PRESETS.has(req.body.resolutionPreset)
    ? req.body.resolutionPreset
    : "1080p";
  const codecExt = extForCodec(codec);
  const outputFileName =
    typeof req.body.outputFileName === "string" && req.body.outputFileName.trim()
      ? sanitizeExportFileName(req.body.outputFileName, codecExt)
      : sanitizeExportFileName("export", codecExt);

  let jpegQuality: number | undefined;
  if (typeof req.body.jpegQuality === "number") {
    jpegQuality = Math.min(100, Math.max(60, Math.round(req.body.jpegQuality)));
  }

  let x264Preset: X264Preset | undefined;
  if (
    typeof req.body.x264Preset === "string" &&
    (X264_PRESETS as readonly string[]).includes(req.body.x264Preset)
  ) {
    x264Preset = req.body.x264Preset as X264Preset;
  }

  const muted = req.body.muted === true;

  const compositionWidth = Number(req.body.compositionWidth) || 1920;
  const compositionHeight = Number(req.body.compositionHeight) || 1080;
  const durationInFrames = Number(req.body.durationInFrames) || 30;
  const getPixelsPerSecond = Number(req.body.getPixelsPerSecond) || 100;

  const cappedForFingerprint = capExportDimensions(
    compositionWidth,
    compositionHeight,
    resolutionPreset,
  );
  const tuningDefaults = getRemotionRenderTuning(
    cappedForFingerprint.width,
    cappedForFingerprint.height,
  );
  const jpegForFingerprint =
    typeof jpegQuality === "number" ? jpegQuality : tuningDefaults.jpegQuality;
  const x264ForFingerprint =
    codec === "h264" ? (x264Preset ?? tuningDefaults.x264Preset) : undefined;

  const contentFingerprint = computeExportFingerprint({
    timelineData: req.body.timelineData,
    durationInFrames,
    compositionWidth,
    compositionHeight,
    codec,
    crf,
    resolutionPreset,
    muted,
    jpegQuality: jpegForFingerprint,
    x264Preset: x264ForFingerprint,
  });

  const cached = await findCachedRender(projectId, userId, contentFingerprint);
  if (cached) {
    const urls = await signRenderAssetUrls(cached);
    console.log(`♻️  Serving cached render for project ${projectId}`);
    res.json({
      cached: true,
      renderId: cached.id,
      fileName: cached.file_name,
      ...urls,
    });
    return;
  }

  const inputProps = {
    timelineData: req.body.timelineData,
    durationInFrames,
    compositionWidth: cappedForFingerprint.width,
    compositionHeight: cappedForFingerprint.height,
    getPixelsPerSecond,
    isRendering: true,
  };

  try {
    const job = await renderQueue.add("render", {
      userId,
      projectId,
      renderJobId,
      contentFingerprint,
      codec,
      crf,
      resolutionPreset,
      outputFileName,
      advancedMode,
      jpegQuality,
      x264Preset,
      muted,
      inputProps,
    });
    console.log(`📬 Render job queued: ${job.id}`);
    res.json({ cached: false, jobId: job.id });
  } catch (err) {
    console.error("❌ Failed to enqueue render:", err);
    res.status(500).json({ error: "Failed to queue render job" });
  }
});

// ─── GET /projects/:projectId/renders — export history ───────────────────────

app.get("/projects/:projectId/renders", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { projectId } = req.params;
  if (!UUID_PATTERN.test(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }
  if (!(await assertProjectOwned(userId, projectId))) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  try {
    const { rows } = await db.query(
      `SELECT id, file_name, codec, width, height, r2_video_key, r2_thumb_key, created_at
       FROM project_renders
       WHERE project_id = $1::uuid AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 50`,
      [projectId, userId],
    );

    const renders = await Promise.all(
      rows.map(async (row) => {
        const urls = await signRenderAssetUrls({
          file_name: row.file_name as string,
          r2_video_key: row.r2_video_key as string,
          r2_thumb_key: (row.r2_thumb_key as string | null) ?? null,
          codec: row.codec as string,
        });
        return {
          id: String(row.id),
          fileName: row.file_name as string,
          codec: row.codec as string,
          width: row.width as number,
          height: row.height as number,
          createdAt: (row.created_at as Date).toISOString(),
          thumbnailUrl: urls.thumbnailUrl,
          previewUrl: urls.previewUrl,
          downloadUrl: urls.downloadUrl,
        };
      }),
    );

    res.json({ renders });
  } catch (err) {
    console.error("export history error:", err);
    res.status(500).json({ error: "Failed to load export history" });
  }
});

// ─── DELETE /projects/:projectId/renders/:renderId ───────────────────────────

app.delete(
  "/projects/:projectId/renders/:renderId",
  async (req: Request, res: Response): Promise<void> => {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { projectId, renderId } = req.params;
    if (!UUID_PATTERN.test(projectId) || !UUID_PATTERN.test(renderId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    if (!(await assertProjectOwned(userId, projectId))) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    try {
      const { rows } = await db.query(
        `SELECT r2_video_key, r2_thumb_key
         FROM project_renders
         WHERE id = $1::uuid AND project_id = $2::uuid AND user_id = $3`,
        [renderId, projectId, userId],
      );
      if (rows.length === 0) {
        res.status(404).json({ error: "Export not found" });
        return;
      }

      const videoKey = rows[0].r2_video_key as string;
      const thumbKey = (rows[0].r2_thumb_key as string | null) ?? null;

      await db.query(
        `DELETE FROM project_renders
         WHERE id = $1::uuid AND project_id = $2::uuid AND user_id = $3`,
        [renderId, projectId, userId],
      );

      try {
        await deleteRenderR2Objects(userId, videoKey, thumbKey);
        console.log(`🗑️ Export deleted: ${renderId} (${videoKey})`);
      } catch (r2Err) {
        console.warn(`⚠️ Export removed from DB but R2 delete failed for ${renderId}:`, r2Err);
      }

      res.status(204).send();
    } catch (err) {
      console.error("delete export error:", err);
      res.status(500).json({ error: "Failed to delete export" });
    }
  },
);

// ─── GET /render/:jobId/events ─────────────────────────────────────────────────
// SSE stream of render progress. Server pushes events — no client polling.

app.get("/render/:jobId/events", async (req: Request, res: Response): Promise<void> => {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).end();
    return;
  }

  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(": heartbeat\n\n");
  }, 30_000);

  // Handle reconnects: check if job already finished
  const job = await Job.fromId(renderQueue, jobId);
  if (!job) {
    send({ type: "error", message: "Job not found" });
    clearInterval(heartbeat);
    res.end();
    return;
  }

  const state = await job.getState();
  if (state === "completed") {
    const rv = parseRenderJobReturn(job.returnvalue);
    if (rv?.downloadUrl) {
      send({ type: "completed", downloadUrl: rv.downloadUrl, fileName: rv.fileName });
    } else {
      send({ type: "error", message: "Render finished but download URL is missing" });
    }
    clearInterval(heartbeat);
    res.end();
    return;
  }
  if (state === "failed") {
    send({ type: "failed", message: job.failedReason ?? "Render failed" });
    clearInterval(heartbeat);
    res.end();
    return;
  }

  const onProgress = ({ jobId: jId, data }: { jobId: string; data: unknown }) => {
    if (jId !== jobId) return;
    send({ type: "progress", percent: typeof data === "number" ? data : 0 });
  };

  const onCompleted = ({ jobId: jId, returnvalue }: { jobId: string; returnvalue: unknown }) => {
    if (jId !== jobId) return;
    const rv = parseRenderJobReturn(returnvalue);
    if (rv?.downloadUrl) {
      send({ type: "completed", downloadUrl: rv.downloadUrl, fileName: rv.fileName });
    } else {
      console.error("Render completed but return value was invalid:", returnvalue);
      send({ type: "error", message: "Render finished but download URL is missing" });
    }
    cleanup();
    res.end();
  };

  const onFailed = ({ jobId: jId, failedReason }: { jobId: string; failedReason: string }) => {
    if (jId !== jobId) return;
    send({ type: "failed", message: failedReason ?? "Render failed" });
    cleanup();
    res.end();
  };

  const cleanup = () => {
    clearInterval(heartbeat);
    renderQueueEvents.off("progress", onProgress);
    renderQueueEvents.off("completed", onCompleted);
    renderQueueEvents.off("failed", onFailed);
  };

  renderQueueEvents.on("progress", onProgress);
  renderQueueEvents.on("completed", onCompleted);
  renderQueueEvents.on("failed", onFailed);
  req.on("close", cleanup);
});

// ─── Start ────────────────────────────────────────────────────────────────────

const port = process.env.PORT || 8000;
void ensureProjectRendersTable()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Render server listening on http://localhost:${port}`);
      console.log(`☁️  Assets bucket: ${ASSETS_BUCKET || "(not set)"}`);
      console.log(`☁️  Renders bucket: ${RENDERS_BUCKET || "(not set)"}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize project_renders table:", err);
    process.exit(1);
  });
