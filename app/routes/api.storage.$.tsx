import { auth } from "~/lib/auth.server";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Resolve current user id using Better Auth runtime API with cookie fallback
  async function requireUserId(req: Request): Promise<string> {
    try {
      // @ts-ignore - runtime API may not be typed
      const session = await auth.api?.getSession?.({ headers: req.headers });
      const userId: string | undefined =
        session?.user?.id ?? session?.session?.userId;
      if (userId) return String(userId);
    } catch {
      console.error("Failed to get session");
    }

    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "localhost:5173";
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    const base = `${proto}://${host}`;
    const cookie = req.headers.get("cookie") || "";
    const res = await fetch(`${base}/api/auth/session`, {
      headers: { Cookie: cookie, Accept: "application/json" },
      method: "GET",
    });
    if (!res.ok)
      throw new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    const json = await res.json().catch(() => ({}));
    const uid: string | undefined =
      json?.user?.id ||
      json?.user?.userId ||
      json?.session?.user?.id ||
      json?.session?.userId ||
      json?.data?.user?.id ||
      json?.data?.user?.userId;
    if (!uid)
      throw new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    return String(uid);
  }

  if (pathname.endsWith("/api/storage") && request.method === "GET") {
    const userId = await requireUserId(request);

    // Query the materialized view user_storage to get total_storage_bytes for this user
    // Create a transient Pool to avoid coupling to repo internals

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
      ssl: process.env.NODE_ENV === "production" 
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false }, // Only disable in development
    });

    let usedBytes = 0;
    try {
      const res = await pool.query<{ total_storage_bytes: string | number }>(
        `select total_storage_bytes from user_storage where user_id = $1 limit 1`,
        [userId]
      );
      if (res.rows.length > 0) {
        const val = res.rows[0].total_storage_bytes;
        usedBytes =
          typeof val === "string" ? parseInt(val, 10) : Number(val || 0);
        if (!Number.isFinite(usedBytes) || usedBytes < 0) usedBytes = 0;
      }
    } finally {
      await pool.end().catch(() => {});
    }

    const limitBytes = 2 * 1024 * 1024 * 1024; // 2GB default

    return new Response(JSON.stringify({ usedBytes, limitBytes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

export async function action() {
  return new Response("Method Not Allowed", { status: 405 });
}
