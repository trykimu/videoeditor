import { createAuthClient } from "better-auth/react";

const baseURL = ((): string => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}`; // base path will be provided by server config
  }
  return "http://localhost:5173";
})();

export const authClient = createAuthClient({ baseURL, basePath: "/api/auth" });
