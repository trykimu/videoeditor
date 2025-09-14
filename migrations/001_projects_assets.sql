CREATE TABLE IF NOT EXISTS "project" (
  "id" UUID PRIMARY KEY,
  "userid" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "timelineState" JSONB NOT NULL DEFAULT '{}',
  "mediabinitem" JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS project_userid_idx ON "project"("userid");
CREATE INDEX IF NOT EXISTS project_created_at_idx ON "project"("createdAt" DESC);

CREATE TABLE IF NOT EXISTS "asset" (
  "id" UUID PRIMARY KEY,
  "mediaurl" TEXT NOT NULL,     -- url wrt the filesystem nginx is serving from
  "projectid" UUID NOT NULL REFERENCES "project"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "sizebytes" BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS asset_projectid_idx ON "asset"("projectid");
CREATE INDEX IF NOT EXISTS asset_mediaurl_idx ON "asset"("mediaurl");
