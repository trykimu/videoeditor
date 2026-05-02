-- Minimal assets table for future Cloudflare R2 integration.
-- Keeps asset IDs and user/project linkage stable.
CREATE TABLE assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_snake();

CREATE INDEX idx_assets_user_created_at
  ON assets(user_id, created_at DESC);

CREATE INDEX idx_assets_user_project_created_at
  ON assets(user_id, project_id, created_at DESC);
