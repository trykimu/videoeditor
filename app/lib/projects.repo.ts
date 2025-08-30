import { Pool } from "pg";
import crypto from "crypto";

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
      throw new Error("Invalid database URL");
    }
    pool = new Pool({ 
      connectionString, 
      ssl: connectionString.includes('supabase.co') 
        ? { rejectUnauthorized: false } // Supabase uses certificates that may not be trusted by Node.js
        : process.env.NODE_ENV === "production" 
          ? { rejectUnauthorized: true }
          : { rejectUnauthorized: false }
    });
  }
  return pool;
}

export type ProjectRecord = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export async function createProject(params: {
  userId: string;
  name: string;
}): Promise<ProjectRecord> {
  const client = await getPool().connect();
  try {
    const id = crypto.randomUUID();
    const { rows } = await client.query<ProjectRecord>(
      `insert into projects (id, user_id, name) values ($1,$2,$3) returning *`,
      [id, params.userId, params.name]
    );
    return rows[0];
  } finally {
    client.release();
  }
}

export async function listProjectsByUser(
  userId: string
): Promise<ProjectRecord[]> {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query<ProjectRecord>(
      `select * from projects where user_id = $1 order by created_at desc`,
      [userId]
    );
    return rows;
  } finally {
    client.release();
  }
}

export async function getProjectById(
  id: string
): Promise<ProjectRecord | null> {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query<ProjectRecord>(
      `select * from projects where id = $1`,
      [id]
    );
    return rows[0] ?? null;
  } finally {
    client.release();
  }
}

export async function deleteProjectById(
  id: string,
  userId: string
): Promise<boolean> {
  const client = await getPool().connect();
  try {
    const { rowCount } = await client.query(
      `delete from projects where id = $1 and user_id = $2`,
      [id, userId]
    );
    return (rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}
