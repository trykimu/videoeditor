-- Consolidated migration: assets table with project support
create table if not exists assets (
  id uuid primary key,
  user_id text not null,
  original_name text not null,
  storage_key text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width int null,
  height int null,
  duration_seconds double precision null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- Ensure columns for evolving installs
alter table assets add column if not exists project_id text null;

-- Ensure user_id has type text (for older installs)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'assets' and column_name = 'user_id' and data_type <> 'text'
  ) then
    execute 'alter table assets alter column user_id type text using user_id::text';
  end if;
exception when others then
  null;
end $$;

create index if not exists idx_assets_user_id_created_at on assets(user_id, created_at desc);
create index if not exists idx_assets_user_project on assets(user_id, project_id, created_at desc);
create unique index if not exists idx_assets_user_storage_key on assets(user_id, storage_key);


