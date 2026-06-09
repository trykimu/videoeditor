/** Base URL for FastAPI from SSR loaders (Docker: direct to fastapi service). */
export function getBackendBaseUrl(request: Request): string {
  const internal = process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "");
  if (internal) return internal;
  const { origin } = new URL(request.url);
  return `${origin}/backend`;
}
