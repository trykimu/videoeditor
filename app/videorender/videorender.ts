import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";
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
  renderJobId: string;
  codec: "h264" | "h265" | "vp9";
  crf: number;
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

const renderQueue = new Queue<RenderJobData>("renders", { connection: createRedisConnection() });
const renderQueueEvents = new QueueEvents("renders", { connection: createRedisConnection() });

const renderWorker = new Worker<RenderJobData, { downloadUrl: string }>(
  "renders",
  async (job) => {
    const { userId, renderJobId, inputProps, codec = "h264", crf = 28 } = job.data;
    const ext = extForCodec(codec);
    const localOutputPath = `out/${renderJobId}.${ext}`;

    await job.updateProgress(5);

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    await job.updateProgress(10);

    let lastReportedProgress = 10;
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec,
      outputLocation: localOutputPath,
      inputProps,
      concurrency: 3,
      verbose: true,
      logLevel: "info",
      onProgress: ({ progress }) => {
        const percent = Math.round(10 + progress * 80);
        if (percent >= lastReportedProgress + 2) {
          lastReportedProgress = percent;
          void job.updateProgress(percent);
        }
      },
      ffmpegOverride: codec === "h264"
        ? ({ args }) => [
            ...args,
            "-preset", "fast",
            "-crf", String(crf),
            "-threads", "3",
            "-tune", "film",
            "-x264-params", "ref=3:me=hex:subme=6:trellis=1",
            "-g", "30",
            "-bf", "2",
            "-maxrate", "8M",
            "-bufsize", "16M",
          ]
        : codec === "h265"
          ? ({ args }) => [...args, "-preset", "fast", "-crf", String(crf), "-tag:v", "hvc1"]
          : ({ args }) => [...args, "-b:v", "0", "-crf", String(crf)],
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

    await job.updateProgress(97);

    const downloadUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: RENDERS_BUCKET,
        Key: renderKey,
        ResponseContentDisposition: `attachment; filename="rendered-video.${ext}"`,
      }),
      { expiresIn: 3600 },
    );

    try { fs.unlinkSync(localOutputPath); } catch {}

    console.log(`📦 Render uploaded: ${renderKey}`);
    return { downloadUrl };
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

// ─── Cookie parsing ───────────────────────────────────────────────────────────

function parseCookieHeader(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(";").map((part) => {
      const [k, ...v] = part.trim().split("=");
      return [k.trim(), decodeURIComponent(v.join("="))];
    }),
  );
}

// ─── Session validation ───────────────────────────────────────────────────────
// Mirrors the exact logic in backend/auth/routes.py: parse the BetterAuth
// session cookie, look up the token in the session table, return userId.
// No service-to-service call needed — the renderer shares the same DB.

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const rawCookie = (req.cookies ?? {})["better-auth.session_token"];
  if (!rawCookie) return null;

  // BetterAuth stores the cookie as "<token>.<hmac-signature>" — only the
  // token portion maps to the session table.
  const token = decodeURIComponent(rawCookie).split(".")[0];
  if (!token) return null;

  try {
    const { rows } = await db.query<{ userId: string }>(
      `SELECT s."userId" FROM session s
        WHERE s.token = $1 AND s."expiresAt" > now()
        LIMIT 1`,
      [token],
    );
    return rows[0]?.userId ?? null;
  } catch {
    return null;
  }
}

// ─── Express app ──────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use(cors());

// Populate req.cookies from the Cookie header.
app.use((req, _res, next) => {
  req.cookies = parseCookieHeader(req.headers.cookie ?? "");
  next();
});

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
  const userId = (await getAuthenticatedUserId(req)) ?? "anonymous";
  const renderJobId = generateUUID();

  const VALID_CODECS = new Set(["h264", "h265", "vp9"]);
  const codec = VALID_CODECS.has(req.body.codec) ? req.body.codec : "h264";
  const crf = typeof req.body.crf === "number" && req.body.crf >= 0 && req.body.crf <= 51
    ? Math.round(req.body.crf)
    : 28;

  const inputProps = {
    timelineData: req.body.timelineData,
    durationInFrames: req.body.durationInFrames,
    compositionWidth: req.body.compositionWidth,
    compositionHeight: req.body.compositionHeight,
    getPixelsPerSecond: req.body.getPixelsPerSecond,
    isRendering: true,
  };

  try {
    const job = await renderQueue.add("render", { userId, renderJobId, codec, crf, inputProps });
    console.log(`📬 Render job queued: ${job.id}`);
    res.json({ jobId: job.id });
  } catch (err) {
    console.error("❌ Failed to enqueue render:", err);
    res.status(500).json({ error: "Failed to queue render job" });
  }
});

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
    const rv = job.returnvalue as { downloadUrl: string } | undefined;
    send({ type: "completed", downloadUrl: rv?.downloadUrl ?? "" });
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

  const onCompleted = ({ jobId: jId, returnvalue }: { jobId: string; returnvalue: string }) => {
    if (jId !== jobId) return;
    try {
      const rv = JSON.parse(returnvalue) as { downloadUrl: string };
      send({ type: "completed", downloadUrl: rv.downloadUrl });
    } catch {
      send({ type: "error", message: "Failed to parse render result" });
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
app.listen(port, () => {
  console.log(`🚀 Render server listening on http://localhost:${port}`);
  console.log(`☁️  Assets bucket: ${ASSETS_BUCKET || "(not set)"}`);
  console.log(`☁️  Renders bucket: ${RENDERS_BUCKET || "(not set)"}`);
});
