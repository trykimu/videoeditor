import "dotenv/config";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

// Strip query params like sslmode so Pool options below take full effect
const rawDbUrl = process.env.DATABASE_URL || "";
let connectionString = rawDbUrl;
try {
  const u = new URL(rawDbUrl);
  u.search = "";
  connectionString = u.toString();
} catch {
  // keep as-is
}

// Rely on Better Auth's official CLI migration for schema.

console.log("🔧 Initializing Better Auth with:");
console.log("🔧 DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("🔧 GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID ? "SET" : "NOT SET");
console.log("🔧 GOOGLE_CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET");
console.log("🔧 Note: baseURL will be auto-detected from request headers");

// Build trusted origins from env + sensible defaults
const prodDomainHost = process.env.PROD_DOMAIN || "trykimu.com";
const protocol = prodDomainHost.includes("localhost") ? "http" : "https";
const defaultTrustedOrigins = [
  // Dev
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // Prod (can be overridden/extended via env)
  `${protocol}://${prodDomainHost}`,
  `${protocol}://www.${prodDomainHost}`,
];

const envTrustedOrigins = (process.env.AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const trustedOrigins = Array.from(new Set([...defaultTrustedOrigins, ...envTrustedOrigins]));

export const auth = betterAuth({
  basePath: "/api/auth",
  // Force baseURL in development so Google gets the correct redirect_uri
  baseURL: process.env.AUTH_BASE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:5173" : undefined),
  // Trust proxy headers to detect HTTPS for secure cookies
  trustProxy: process.env.NODE_ENV === "production",
  // Let Better Auth auto-detect baseURL from the request
  database: new Pool({
    connectionString,
    ssl: connectionString.includes("supabase.co")
      ? { rejectUnauthorized: false } // Supabase uses certificates that may not be trusted by Node.js
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
  }),

  // Add debugging and callback configuration
  logger: {
    level: "debug",
  },

  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      // Let Better Auth use its default callback endpoint
      // redirectURI will be automatically set to: {baseURL}/api/auth/callback/google
    },
  },
  session: {
    // Increase session expiry
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookie: {
      // Use "lax" for same-site requests, "none" only needed for cross-origin
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
      secure: process.env.NODE_ENV === "production",
      // In production, pin cookie domain to apex so subdomains (if any) share
      // Set via env if provided, else let browser infer from host header
      ...(process.env.AUTH_COOKIE_DOMAIN ? { domain: process.env.AUTH_COOKIE_DOMAIN } : {}),
      path: "/",
    },
  },
  // Trusted origins for CORS and cookies
  trustedOrigins,
});
// Schema is managed via CLI migrations.
