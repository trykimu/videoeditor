-- Export history per project (video + thumbnail in R2, keyed by content fingerprint).
CREATE TABLE IF NOT EXISTS project_renders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id             TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  render_job_id       UUID NOT NULL,
  content_fingerprint TEXT NOT NULL,
  file_name           TEXT NOT NULL,
  codec               TEXT NOT NULL,
  width               INT NOT NULL,
  height              INT NOT NULL,
  duration_frames     INT,
  crf                 INT,
  resolution_preset   TEXT,
  r2_video_key        TEXT NOT NULL,
  r2_thumb_key        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_renders_project_created
  ON project_renders(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_renders_fingerprint
  ON project_renders(project_id, user_id, content_fingerprint, created_at DESC);
