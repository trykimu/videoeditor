const safeEnv = (key: string, fallback?: string): string | undefined => {
  try {
    // In browser environments process may be undefined
    // @ts-ignore
    return typeof process !== "undefined" && process.env ? process.env[key] : fallback;
  } catch {
    return fallback;
  }
};

export const getApiBaseUrl = (fastapi: boolean = false, betterauth: boolean = false): string => {
  const nodeEnv = safeEnv("NODE_ENV", "development");
  const isProduction = nodeEnv === "production";
  const prodDomainHost = safeEnv("PROD_DOMAIN", "trykimu.com") as string;

  // Handle localhost development case
  const protocol = prodDomainHost.includes("localhost") ? "http" : "https";
  const prodDomain = `${protocol}://${prodDomainHost}`;

  if (betterauth) {
    return isProduction ? prodDomain : "http://localhost:5173"; // frontend  NOTE: this will be deleted, it is repeating logic. It'll be the default.
  } else if (fastapi) {
    return isProduction ? `${prodDomain}/ai/api` : "http://127.0.0.1:3000"; // fastapi backend
  } else {
    return isProduction ? `${prodDomain}/render` : "http://localhost:8000"; // remotion render server
  }
};

export const apiUrl = (endpoint: string, fastapi: boolean = false, betterauth: boolean = false): string => {
  const baseUrl = getApiBaseUrl(fastapi, betterauth);
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return path ? `${baseUrl}${path}` : `${baseUrl}`;
};
