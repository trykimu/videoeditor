import type { Route } from "./+types/api.auth.$";
import { auth } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  // Forward the request to Better Auth; it handles all subpaths
  const url = new URL(request.url);
  const isCallback = url.pathname.includes("/api/auth/callback/");
  const res = await auth.handler(request);
  // Normalize no-session to 200 so clients can treat it as "logged out"
  try {
    if (url.pathname.endsWith("/session") && res.status === 404) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    console.error("Failed to get session");
  }
  // After successful OAuth callback, redirect to /projects
  if (isCallback && (res.status === 200 || res.status === 302)) {
    const headers = new Headers(res.headers);
    headers.set("Location", "/projects");
    return new Response(null, { status: 302, headers });
  }
  return res;
}

export async function action({ request }: Route.ActionArgs) {
  return auth.handler(request);
}
