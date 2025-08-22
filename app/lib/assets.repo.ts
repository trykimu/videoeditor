import { Pool } from "pg";
import crypto from "crypto";

export type AssetRecord = {
  id: string;
  user_id: string;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  created_at: string;
  deleted_at: string | null;
};

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const rawDbUrl = process.env.DATABASE_URL || "";
    let connectionString = rawDbUrl;
    try {
      const u = new URL(rawDbUrl);
      u.search = "";
      connectionString = u.toString();
    } catch {
      // keep as-is
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function ensureAssetsTable(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`
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
      create index if not exists idx_assets_user_id_created_at on assets(user_id, created_at desc);
      create unique index if not exists idx_assets_user_storage_key on assets(user_id, storage_key);
    `);
    // If table already existed with user_id as uuid, migrate it to text
    try {
      await client.query(
        `alter table assets alter column user_id type text using user_id::text;`
      );
    } catch {
      // ignore if already text or migration not needed
    }
  } finally {
    client.release();
  }
}

export async function insertAsset(params: {
  userId: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}): Promise<AssetRecord> {
  const client = await getPool().connect();
  try {
    const id = crypto.randomUUID();
    const { rows } = await client.query<AssetRecord>(
      `insert into assets (id, user_id, original_name, storage_key, mime_type, size_bytes, width, height, duration_seconds)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       returning *`,
      [
        id,
        params.userId,
        params.originalName,
        params.storageKey,
        params.mimeType,
        params.sizeBytes,
        params.width ?? null,
        params.height ?? null,
        params.durationSeconds ?? null,
      ]
    );
    return rows[0];
  } finally {
    client.release();
  }
}

export async function listAssetsByUser(userId: string): Promise<AssetRecord[]> {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query<AssetRecord>(
      `select * from assets where user_id = $1 and deleted_at is null order by created_at desc`,
      [userId]
    );
    return rows;
  } finally {
    client.release();
  }
}

export async function getAssetById(id: string): Promise<AssetRecord | null> {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query<AssetRecord>(
      `select * from assets where id = $1 and deleted_at is null`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function softDeleteAsset(id: string, userId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(
      `update assets set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null`,
      [id, userId]
    );
  } finally {
    client.release();
  }
}


