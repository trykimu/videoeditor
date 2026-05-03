-- Projects table with timeline persistence.
CREATE TABLE IF NOT EXISTS projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  timeline_state JSONB NOT NULL DEFAULT '{"tracks":[]}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep snake_case updated_at current.
CREATE OR REPLACE FUNCTION set_updated_at_snake() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_snake();

CREATE INDEX IF NOT EXISTS idx_projects_user_created_at
  ON projects(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_user_updated_at
  ON projects(user_id, updated_at DESC);
