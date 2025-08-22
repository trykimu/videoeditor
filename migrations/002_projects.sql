-- Minimal projects table to support asset scoping later
create table if not exists projects (
  id uuid primary key,
  user_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id_created_at on projects(user_id, created_at desc);


