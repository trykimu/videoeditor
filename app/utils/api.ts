export const getApiBaseUrl = (fastapi: boolean = false, betterauth: boolean = false): string => {
  if (betterauth) {
    return "http://localhost:5173";
  } else if (fastapi) {
    return "http://127.0.0.1:3000";
  } else {
    return "http://localhost:8000";
  }
};

export const apiUrl = (endpoint: string, fastapi: boolean = false, betterauth: boolean = false): string => {
  const baseUrl = getApiBaseUrl(fastapi, betterauth);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  console.log(`endpoint: ${endpoint} -> ${baseUrl}${cleanEndpoint}\nfastapi: ${fastapi}\nbetterauth: ${betterauth}`);
  return `${baseUrl}${cleanEndpoint}`;
};