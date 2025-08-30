import { Pool } from "pg";
import crypto from "crypto";

export type AssetRecord = {
  id: string;
  user_id: string;
  project_id: string | null;
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
      ssl: connectionString.includes('supabase.co') 
        ? { rejectUnauthorized: false } // Supabase uses certificates that may not be trusted by Node.js
        : process.env.NODE_ENV === "production" 
          ? { rejectUnauthorized: true }
          : { rejectUnauthorized: false },
    });
  }
  return pool;
}

// Schema creation is handled by SQL migrations in /migrations.

export async function insertAsset(params: {
  userId: string;
  projectId?: string | null;
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
      `insert into assets (id, user_id, project_id, original_name, storage_key, mime_type, size_bytes, width, height, duration_seconds)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       returning *`,
      [
        id,
        params.userId,
        params.projectId ?? null,
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

export async function listAssetsByUser(
  userId: string,
  projectId: string | null
): Promise<AssetRecord[]> {
  const client = await getPool().connect();
  try {
    const query =
      projectId === null
        ? `select * from assets where user_id = $1 and project_id is null and deleted_at is null order by created_at desc`
        : `select * from assets where user_id = $1 and project_id = $2 and deleted_at is null order by created_at desc`;
    const params = projectId === null ? [userId] : [userId, projectId];
    const { rows } = await client.query<AssetRecord>(query, params);
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

export async function softDeleteAsset(
  id: string,
  userId: string
): Promise<void> {
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
