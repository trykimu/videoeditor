import { auth } from "~/lib/auth.server";
import { createProject, getProjectById, listProjectsByUser, deleteProjectById } from "~/lib/projects.repo";
import { listAssetsByUser, getAssetById, softDeleteAsset } from "~/lib/assets.repo";
import fs from "fs";
import path from "path";
import { loadTimeline, saveTimeline, loadProjectState, saveProjectState } from "~/lib/timeline.store";
import type { MediaBinItem, TimelineState } from "~/components/timeline/types";
import { z } from "zod";
import {
  ProjectsResponseSchema,
  ProjectStateResponseSchema,
  CreateProjectBodySchema,
  PatchProjectBodySchema,
} from "~/schemas";

async function requireUserId(request: Request): Promise<string> {
  try {
    const session = await auth.api?.getSession?.({ headers: request.headers });
    const uid: string | undefined = session?.user?.id || session?.session?.userId;
    if (uid) return String(uid);
  } catch {
    console.error("Failed to get session");
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:5173";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/auth/session`, {
    headers: { Cookie: request.headers.get("cookie") || "" },
  });
  if (!res.ok) throw new Response("Unauthorized", { status: 401 });
  const json = await res.json().catch(() => ({}));
  const uid2: string | undefined = json?.user?.id || json?.userId || json?.session?.userId || json?.data?.user?.id;
  if (!uid2) throw new Response("Unauthorized", { status: 401 });
  return String(uid2);
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userId = await requireUserId(request);

  // GET /api/projects -> list
  if (pathname.endsWith("/api/projects") && request.method === "GET") {
    const rows = await listProjectsByUser(userId);
    const payload = ProjectsResponseSchema.parse({ projects: rows });
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /api/projects/:id -> get (owner only)
  const m = pathname.match(/\/api\/projects\/([^/]+)$/);
  if (m && request.method === "GET") {
    const id = m[1];
    const proj = await getProjectById(id);
    if (!proj || proj.user_id !== userId) return new Response("Not Found", { status: 404 });
    const state = await loadProjectState(id);
    const payload = ProjectStateResponseSchema.parse({
      project: proj,
      timeline: state.timeline,
      textBinItems: state.textBinItems,
    });
    return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  // DELETE /api/projects/:id -> delete project and assets
  if (m && request.method === "DELETE") {
    const id = m[1];
    const proj = await getProjectById(id);
    if (!proj || proj.user_id !== userId) return new Response("Not Found", { status: 404 });

    // Delete assets belonging to this project
    try {
      const assets = await listAssetsByUser(userId, id);
      for (const a of assets) {
        // Remove file from out/
        try {
          // Validate storage_key to prevent path traversal
          if (!a.storage_key || typeof a.storage_key !== "string") {
            console.error("Invalid storage key");
            continue;
          }
          // Sanitize the storage key to prevent path traversal
          const sanitizedKey = path.basename(a.storage_key);
          const filePath = path.resolve("out", sanitizedKey);
          if (filePath.startsWith(path.resolve("out")) && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch {
          console.error("Failed to delete asset");
        }
        await softDeleteAsset(a.id, userId);
      }
    } catch {
      console.error("Failed to delete assets");
    }

    const ok = await deleteProjectById(id, userId);
    if (!ok) return new Response("Not Found", { status: 404 });
    // remove timeline file if exists
    try {
      await fs.promises.unlink(path.resolve(process.env.TIMELINE_DIR || "project_data", `${id}.json`));
    } catch {
      console.error("Failed to delete timeline file");
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

export async function action({ request }: { request: Request }) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userId = await requireUserId(request);

  // POST /api/projects -> create
  if (pathname.endsWith("/api/projects") && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const parsed = CreateProjectBodySchema.safeParse(body);
    const name: string = parsed.success ? parsed.data.name : "Untitled Project";
    const proj = await createProject({ userId, name });
    return new Response(JSON.stringify({ project: proj }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  // DELETE /api/projects/:id
  const delMatch = pathname.match(/\/api\/projects\/([^/]+)$/);
  if (delMatch && request.method === "DELETE") {
    const id = delMatch[1];
    const proj = await getProjectById(id);
    if (!proj || proj.user_id !== userId) return new Response("Not Found", { status: 404 });
    // cascade delete assets (files + soft delete rows)
    try {
      const assets = await listAssetsByUser(userId, id);
      for (const a of assets) {
        try {
          const filePath = path.resolve("out", a.storage_key);
          if (filePath.startsWith(path.resolve("out")) && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch {
          console.error("Failed to delete asset");
        }
        await softDeleteAsset(a.id, userId);
      }
    } catch {
      console.error("Failed to delete assets");
    }
    const ok = await deleteProjectById(id, userId);
    if (!ok) return new Response("Not Found", { status: 404 });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // PATCH /api/projects/:id -> rename
  const patchMatch = pathname.match(/\/api\/projects\/([^/]+)$/);
  if (patchMatch && request.method === "PATCH") {
    const id = patchMatch[1];
    const proj = await getProjectById(id);
    if (!proj || proj.user_id !== userId) return new Response("Not Found", { status: 404 });
    const body = await request.json().catch(() => ({}));
    const parsed = PatchProjectBodySchema.safeParse(body);
    const name: string | undefined = parsed.success ? parsed.data.name : undefined;
    const timeline: TimelineState | undefined = (parsed.success ? parsed.data.timeline : undefined) as any;
    const textBinItems: MediaBinItem[] | undefined = (parsed.success ? parsed.data.textBinItems : undefined) as any;
    if (!name && !timeline && !textBinItems)
      return new Response(JSON.stringify({ error: "No changes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    // simple update
    // inline update using pg (reuse pool via repo)
    // quick import avoided; execute with small query here

    // @ts-ignore
    const { Pool } = await import("pg");
    const rawDbUrl = process.env.DATABASE_URL || "";
    let connectionString = rawDbUrl;
    try {
      const u = new URL(rawDbUrl);
      u.search = "";
      connectionString = u.toString();
    } catch {
      console.error("Invalid database URL");
    }
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : { rejectUnauthorized: false }, // Only disable in development
    });
    try {
      if (name) {
        await pool.query(`update projects set name = $1, updated_at = now() where id = $2 and user_id = $3`, [
          name,
          id,
          userId,
        ]);
      }
    } finally {
      await pool.end();
    }
    if (timeline || textBinItems) {
      const prev = await loadProjectState(id);
      await saveProjectState(id, {
        timeline: timeline ?? prev.timeline,
        textBinItems: textBinItems ?? prev.textBinItems,
      });
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}
