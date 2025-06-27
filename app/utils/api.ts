// Set to true for production, false for development
const isProduction = false;

export const getApiBaseUrl = (fastapi: boolean = false): string => {
  if (!isProduction) {
    return fastapi ? "http://127.0.0.1:3000" : "http://localhost:8000";
  }

  if (typeof window !== "undefined" && !fastapi) {
    return `${window.location.origin}/api`;
  } else if (typeof window !== "undefined" && fastapi) {
    return `${window.location.origin}/ai/api`;
  }

  // Fallback for SSR or other environments (idk)
  return "/api";
};

export const apiUrl = (endpoint: string, fastapi: boolean = false): string => {
  const baseUrl = getApiBaseUrl(fastapi);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};