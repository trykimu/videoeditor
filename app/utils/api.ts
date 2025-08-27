// Dynamic environment detection using Vite
// @ts-ignore
const isProduction: boolean = typeof import.meta !== "undefined" && import.meta.env ? !!import.meta.env.PROD : process.env.NODE_ENV === "production";

export const getApiBaseUrl = (fastapi: boolean = false, betterauth: boolean = false): string => {
  // In development, point directly to local services
  if (!isProduction) {
    // betterauth=true -> front-end dev server origin (Better Auth runs in the same app)
    if (betterauth) return "http://localhost:5173";
    // fastapi=true -> python backend
    return fastapi ? "http://127.0.0.1:3000" : "http://localhost:8000";
  }

  // In production, go through the reverse proxy paths

  if (typeof window !== "undefined") {
    // Better Auth lives under /api/auth on the frontend app → use origin without /api
    if (betterauth) return `${window.location.origin}`;
    // FastAPI (Python) is routed under /ai/api
    if (fastapi) return `${window.location.origin}/ai/api`;
    // Node backend is under /api
    return `${window.location.origin}/api`;
  }

  // Fallback for SSR
  return "/";
};

export const apiUrl = (endpoint: string, fastapi: boolean = false, betterauth: boolean = false): string => {
  const baseUrl = getApiBaseUrl(fastapi, betterauth);
  let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Normalize FastAPI when base already includes /ai/api
  if (fastapi) {
    if (path === "/ai") path = "";
    else if (path.startsWith("/ai/")) path = path.slice(3);
  }

  return path ? `${baseUrl}${path}` : `${baseUrl}`;
};