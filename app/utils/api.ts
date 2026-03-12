export const getApiBaseUrl = (fastapi: boolean = false): string => {
  const isProduction = process.env.NODE_ENV === "production";

  if (fastapi) {
    return isProduction ? "https://trykimu.com/ai/api" : "http://127.0.0.1:3000"; // fastapi backend
  } else {
    return isProduction ? "https://trykimu.com/render" : "http://localhost:8000"; // remotion render server
  }
};

export const apiUrl = (endpoint: string, fastapi: boolean = false): string => {
  const baseUrl = getApiBaseUrl(fastapi);
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return path ? `${baseUrl}${path}` : `${baseUrl}`;
};
