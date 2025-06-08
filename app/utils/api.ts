// Get the API base URL - works both in development and production
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In browser - use current origin + /api
    return `${window.location.origin}/api`;
  }
  // Fallback for SSR or other environments
  return '/api';
};

// Convenience function to build API URLs
export const apiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}; 