-- Assets feature: Cloudflare R2 storage with content-addressed deduplication.
--
-- r2_objects  — one row per unique file (SHA-256). Physical storage in R2.
--               Multiple users can reference the same object.
-- assets      — one row per user+file. References r2_objects via content_hash.
--               Soft-deleted; R2 object is removed only when no active rows remain.

-- ─── Shared R2 objects (dedup store) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS r2_objects (
  content_hash  TEXT PRIMARY KEY,           -- SHA-256 hex (64 chars)
  r2_key        TEXT NOT NULL UNIQUE,       -- e.g. objects/abc123.mp4
  file_size     BIGINT NOT NULL,
  mime_type     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'ready')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Per-user asset records ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  content_hash     TEXT REFERENCES r2_objects(content_hash),
  r2_key           TEXT,
  filename         TEXT,
  file_size        BIGINT,
  mime_type        TEXT,
  media_type       TEXT,                    -- video | audio | image
  duration_seconds FLOAT,
  width            INT,
  height           INT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'uploading', 'ready', 'failed')),
  public_url       TEXT,                    -- legacy URL field (no longer required for auth-protected access)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_assets_updated_at ON assets;
CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_snake();

DROP TRIGGER IF EXISTS trg_r2_objects_updated_at ON r2_objects;
CREATE TRIGGER trg_r2_objects_updated_at
  BEFORE UPDATE ON r2_objects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_snake();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_assets_user_created_at
  ON assets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_user_project_created_at
  ON assets(user_id, project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assets_status
  ON assets(user_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assets_content_hash
  ON assets(content_hash) WHERE deleted_at IS NULL;
