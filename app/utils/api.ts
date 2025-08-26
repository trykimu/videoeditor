// Dynamic environment detection using Vite
// @ts-ignore
const isProduction: boolean = typeof import.meta !== "undefined" && import.meta.env ? !!import.meta.env.PROD : process.env.NODE_ENV === "production";

export const getApiBaseUrl = (fastapi: boolean = false, betterauth: boolean = false): string => {
  // In development, point directly to local services
  if (!isProduction) {
    // fastapi=true -> python backend (8000)
    if (betterauth) return "http://localhost:5173";
    return fastapi ? "http://127.0.0.1:3000" : "http://localhost:8000";
    // // Otherwise, use same-origin so it works on whatever port the app runs on (e.g., 3000 or 5173 with proxy)
    // if (typeof window !== "undefined") {
    //   return `${window.location.origin}/api`;
    // }
    // return "/api";
  }

  // In production, go through the reverse proxy paths
  if (typeof window !== "undefined" && betterauth) {
    return `${window.location.origin}/api/auth`;
  } else if (typeof window !== "undefined" && !fastapi) {
    return `${window.location.origin}/api`;
  } else if (typeof window !== "undefined" && fastapi) {
    return `${window.location.origin}/ai/api`;
  }

  // Fallback for SSR or other environments
  return "/api";
};

export const apiUrl = (endpoint: string, fastapi: boolean = false, betterauth: boolean = false): string => {
  const baseUrl = getApiBaseUrl(fastapi, betterauth);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  console.log(`endpoint: ${endpoint} -> ${baseUrl}${cleanEndpoint}\nfastapi: ${fastapi}\nbetterauth: ${betterauth}`);
  return `${baseUrl}${cleanEndpoint}`;
};