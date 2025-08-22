import type { Route } from "./+types/api.assets.$";
import { auth } from "~/lib/auth.server";
import {
  ensureAssetsTable,
  insertAsset,
  listAssetsByUser,
  getAssetById,
  softDeleteAsset,
} from "~/lib/assets.repo";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve("out");
let ensured = false;

async function requireUserId(request: Request): Promise<string> {
  // Try Better Auth runtime API first
  try {
    // @ts-ignore - runtime API may not be typed
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const userId: string | undefined = session?.user?.id || session?.userId || session?.session?.user?.id || session?.session?.userId;
    if (userId) return String(userId);
  } catch {}

  // Fallback: call /api/auth/session with forwarded cookies
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:5173";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;
  const cookie = request.headers.get("cookie") || "";
  const res = await fetch(`${base}/api/auth/session`, {
    headers: {
      Cookie: cookie,
      Accept: "application/json",
    },
    method: "GET",
  });
  if (!res.ok) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const json = await res.json().catch(() => ({} as any));
  const uid: string | undefined =
    json?.user?.id || json?.user?.userId || json?.session?.user?.id || json?.session?.userId || json?.data?.user?.id || json?.data?.user?.userId;
  if (!uid) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return String(uid);
}

function inferMediaTypeFromName(name: string, fallback: string = "application/octet-stream"): string {
  const ext = path.extname(name).toLowerCase();
  if ([".mp4", ".mov", ".webm", ".mkv", ".avi"].includes(ext)) return "video/*";
  if ([".mp3", ".wav", ".aac", ".ogg", ".flac"].includes(ext)) return "audio/*";
  if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext)) return "image/*";
  return fallback;
}

export async function loader({ request }: Route.LoaderArgs) {
  if (!ensured) {
    ensured = true;
    await ensureAssetsTable();
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  const userId = await requireUserId(request);

  // GET /api/assets -> list assets for user
  if (pathname.endsWith("/api/assets") && request.method === "GET") {
    const rows = await listAssetsByUser(userId);
    const items = rows.map((r) => ({
      id: r.id,
      name: r.original_name,
      mime_type: r.mime_type,
      size_bytes: r.size_bytes,
      width: r.width,
      height: r.height,
      duration_seconds: r.duration_seconds,
      created_at: r.created_at,
      mediaUrlRemote: `/api/assets/${r.id}/raw`,
      fullUrl: `http://localhost:8000/media/${encodeURIComponent(r.storage_key)}`,
    }));
    return new Response(JSON.stringify({ assets: items }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /api/assets/:id/raw -> stream file with auth
  const rawMatch = pathname.match(/\/api\/assets\/([^/]+)\/raw$/);
  if (rawMatch && request.method === "GET") {
    const assetId = rawMatch[1];
    const asset = await getAssetById(assetId);
    if (!asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const filePath = path.resolve(OUT_DIR, asset.storage_key);
    if (!filePath.startsWith(OUT_DIR) || !fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Support range requests for video/audio
    const stat = fs.statSync(filePath);
    const range = request.headers.get("range");
    const contentType = asset.mime_type || inferMediaTypeFromName(asset.original_name);
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      if (isNaN(start) || isNaN(end) || start > end || start < 0 || end >= stat.size) {
        return new Response(undefined, { status: 416 });
      }
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      return new Response(stream as unknown as BodyInit, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
        },
      });
    }

    const stream = fs.createReadStream(filePath);
    return new Response(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Length": String(stat.size),
        "Content-Type": contentType,
      },
    });
  }

  return new Response("Not Found", { status: 404 });
}

export async function action({ request }: Route.ActionArgs) {
  if (!ensured) {
    ensured = true;
    await ensureAssetsTable();
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  const userId = await requireUserId(request);

  // POST /api/assets/upload -> proxy file to existing 8000 upload and record DB
  if (pathname.endsWith("/api/assets/upload") && method === "POST") {
    const width = Number(request.headers.get("x-media-width") || "") || null;
    const height = Number(request.headers.get("x-media-height") || "") || null;
    const duration = Number(request.headers.get("x-media-duration") || "") || null;
    const originalNameHeader = request.headers.get("x-original-name") || "file";

    // Parse incoming multipart form
    const incoming = await request.formData();
    const media = incoming.get("media");
    if (!(media instanceof Blob)) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Reconstruct a new FormData and forward to 8000 so boundary is correct; faster and streams
    const form = new FormData();
    const filenameFor8000 = (media as any)?.name || originalNameHeader || "upload.bin";
    form.append("media", media, filenameFor8000);

    const forwardRes = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: form,
    });

    if (!forwardRes.ok) {
      const errText = await forwardRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "Upload failed", detail: errText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const json = await forwardRes.json() as any;
    const filename: string = json.filename;
    const size: number = json.size;
    const mime = inferMediaTypeFromName(filenameFor8000, "application/octet-stream");

    const record = await insertAsset({
      userId,
      originalName: filenameFor8000,
      storageKey: filename,
      mimeType: mime,
      sizeBytes: Number(size) || 0,
      width,
      height,
      durationSeconds: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        asset: {
          id: record.id,
          name: record.original_name,
          mediaUrlRemote: `/api/assets/${record.id}/raw`,
          fullUrl: `http://localhost:8000/media/${encodeURIComponent(filename)}`,
          width: record.width,
          height: record.height,
          durationInSeconds: record.duration_seconds,
          size: record.size_bytes,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // POST /api/assets/register -> register an already-uploaded file from out/
  if (pathname.endsWith("/api/assets/register") && method === "POST") {
    const body = await request.json().catch(() => ({} as any));
    const filename: string | undefined = body.filename;
    const originalName: string | undefined = body.originalName;
    const size: number | undefined = body.size;
    const width: number | null = typeof body.width === 'number' ? body.width : null;
    const height: number | null = typeof body.height === 'number' ? body.height : null;
    const duration: number | null = typeof body.duration === 'number' ? body.duration : null;

    if (!filename || !originalName) {
      return new Response(JSON.stringify({ error: "filename and originalName are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const filePath = path.resolve(OUT_DIR, decodeURIComponent(filename));
    if (!filePath.startsWith(OUT_DIR) || !fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: "File not found in out/" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const stat = fs.statSync(filePath);
    const mime = inferMediaTypeFromName(originalName, "application/octet-stream");

    const record = await insertAsset({
      userId,
      originalName,
      storageKey: path.basename(filePath),
      mimeType: mime,
      sizeBytes: typeof size === 'number' ? size : stat.size,
      width,
      height,
      durationSeconds: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        asset: {
          id: record.id,
          name: record.original_name,
          mediaUrlRemote: `/api/assets/${record.id}/raw`,
          fullUrl: `http://localhost:8000/media/${encodeURIComponent(record.storage_key)}`,
          width: record.width,
          height: record.height,
          durationInSeconds: record.duration_seconds,
          size: record.size_bytes,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // DELETE /api/assets/:id -> delete
  const delMatch = pathname.match(/\/api\/assets\/([^/]+)$/);
  if (delMatch && method === "DELETE") {
    const assetId = delMatch[1];
    const asset = await getAssetById(assetId);
    if (!asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const filePath = path.resolve(OUT_DIR, asset.storage_key);
    if (filePath.startsWith(OUT_DIR) && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }
    await softDeleteAsset(assetId, userId);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST /api/assets/:id/clone -> clone to new file and record
  const cloneMatch = pathname.match(/\/api\/assets\/([^/]+)\/clone$/);
  if (cloneMatch && method === "POST") {
    const assetId = cloneMatch[1];
    const suffix = (await request.json().catch(() => ({})))?.suffix || "copy";
    const asset = await getAssetById(assetId);
    if (!asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const srcPath = path.resolve(OUT_DIR, asset.storage_key);
    if (!srcPath.startsWith(OUT_DIR) || !fs.existsSync(srcPath)) {
      return new Response(JSON.stringify({ error: "Source missing" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const timestamp = Date.now();
    const ext = path.extname(asset.storage_key);
    const base = path.basename(asset.storage_key, ext);
    const newFilename = `${base}_${suffix}_${timestamp}${ext}`;
    const destPath = path.resolve(OUT_DIR, newFilename);
    fs.copyFileSync(srcPath, destPath);

    const stat = fs.statSync(destPath);
    const record = await insertAsset({
      userId,
      originalName: `${asset.original_name} ${suffix}`.trim(),
      storageKey: newFilename,
      mimeType: asset.mime_type,
      sizeBytes: stat.size,
      width: asset.width,
      height: asset.height,
      durationSeconds: asset.duration_seconds,
    });

    return new Response(
      JSON.stringify({
        success: true,
        asset: {
          id: record.id,
          name: record.original_name,
          mediaUrlRemote: `/api/assets/${record.id}/raw`,
          fullUrl: `http://localhost:8000/media/${encodeURIComponent(newFilename)}`,
          width: record.width,
          height: record.height,
          durationInSeconds: record.duration_seconds,
          size: record.size_bytes,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response("Not Found", { status: 404 });
}


