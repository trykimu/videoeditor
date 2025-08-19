import "dotenv/config";
import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Only disable TLS verification in development environment
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
process.env.PGSSLMODE = "no-verify";

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
const defaultTrustedOrigins = [
  // Dev
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  // Prod (can be overridden/extended via env)
  "https://trykimu.com",
  "https://www.trykimu.com",
];

const envTrustedOrigins = (process.env.AUTH_TRUSTED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const trustedOrigins = Array.from(new Set([...defaultTrustedOrigins, ...envTrustedOrigins]));

export const auth = betterAuth({
  basePath: "/api/auth",
  // Force baseURL in development so Google gets the correct redirect_uri
  baseURL: process.env.AUTH_BASE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined),
  // Let Better Auth auto-detect baseURL from the request
  database: new Pool({
    connectionString,
    // Temporarily disable SSL verification for development
    ssl: { rejectUnauthorized: false },
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
      // Ensure cookies work on localhost during development
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },
  
  // Trusted origins for CORS and cookies
  trustedOrigins,
});

// Schema is managed via CLI migrations.


