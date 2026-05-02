CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- BetterAuth: user table
CREATE TABLE "user" (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  "emailVerified"  BOOLEAN NOT NULL DEFAULT FALSE,
  image            TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BetterAuth: session table
CREATE TABLE session (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  token        TEXT NOT NULL UNIQUE,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "userId"     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- BetterAuth: account table
CREATE TABLE account (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "accountId"             TEXT NOT NULL,
  "providerId"            TEXT NOT NULL,
  "userId"                TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"           TEXT,
  "refreshToken"          TEXT,
  "idToken"               TEXT,
  "accessTokenExpiresAt"  TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope                   TEXT,
  password                TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BetterAuth: verification table
CREATE TABLE verification (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier   TEXT NOT NULL,
  value        TEXT NOT NULL,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guard against adapters that pass null/empty IDs.
CREATE OR REPLACE FUNCTION set_user_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id = gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_verification_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id = gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Keep camelCase BetterAuth updatedAt current.
CREATE OR REPLACE FUNCTION set_updated_at_camel() RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_camel();

CREATE TRIGGER trg_session_updated_at
  BEFORE UPDATE ON session
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_camel();

CREATE TRIGGER trg_account_updated_at
  BEFORE UPDATE ON account
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_camel();

CREATE TRIGGER trg_verification_updated_at
  BEFORE UPDATE ON verification
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_camel();

CREATE TRIGGER trg_user_set_id
  BEFORE INSERT ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id();

CREATE TRIGGER trg_verification_set_id
  BEFORE INSERT ON verification
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_id();

CREATE INDEX idx_session_user_id ON session("userId");
CREATE INDEX idx_account_user_id ON account("userId");
CREATE INDEX idx_account_provider ON account("providerId", "accountId");
CREATE INDEX idx_verification_identifier ON verification(identifier);
