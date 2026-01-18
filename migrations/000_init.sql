-- 000_init.sql - initial auth tables

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NULL,
  email text UNIQUE NOT NULL,
  "emailVerified" boolean DEFAULT false NOT NULL,
  image text NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text UNIQUE NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text NULL,
  "userAgent" text NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_session_userId ON session("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);

-- Accounts table
CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY,
  "accountId" text NULL,
  "providerId" text NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" text NULL,
  "refreshToken" text NULL,
  "idToken" text NULL,
  "accessTokenExpiresAt" timestamptz NULL,
  "refreshTokenExpiresAt" timestamptz NULL,
  scope text NULL,
  password text NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_account_userId ON account("userId");

-- Verification table
CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

-- Trigger function to auto-update updatedAt
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to update updatedAt automatically
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_user_updated_at') THEN
    CREATE TRIGGER trg_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_session_updated_at') THEN
    CREATE TRIGGER trg_session_updated_at
    BEFORE UPDATE ON session
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_account_updated_at') THEN
    CREATE TRIGGER trg_account_updated_at
    BEFORE UPDATE ON account
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_verification_updated_at') THEN
    CREATE TRIGGER trg_verification_updated_at
    BEFORE UPDATE ON verification
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
