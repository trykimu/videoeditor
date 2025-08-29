export const getApiBaseUrl = (fastapi: boolean = false, betterauth: boolean = false): string => {
  const isProduction = process.env.NODE_ENV === "production";

  if (betterauth) {
    return isProduction ? "https://trykimu.com" : "http://localhost:5173";  // frontend  NOTE: this will be deleted, it is repeating logic. It'll be the default.
  } else if (fastapi) {
    return isProduction ? "https://trykimu.com/ai/api" : "http://127.0.0.1:3000";  // fastapi backend
  } else {
    return isProduction ? "https://trykimu.com/render" : "http://localhost:8000";   // remotion render server
  }
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