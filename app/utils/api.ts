// Set to true for production, false for development
const isProduction = true;

export const getApiBaseUrl = (): string => {
  if (!isProduction) {
    // Test mode - use localhost:8000
    return "http://localhost:8000";
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  // Fallback for SSR or other environments (idk)
  return "/api";
};

export const apiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};
