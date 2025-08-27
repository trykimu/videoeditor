import "dotenv/config";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

async function run() {
  const rawDbUrl = process.env.DATABASE_URL || "";
  let connectionString = rawDbUrl;
  try {
    const u = new URL(rawDbUrl);
    u.search = "";
    connectionString = u.toString();
  } catch {
    console.error("Invalid database URL");
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const dir = path.resolve("migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      console.log(`Running migration: ${file}`);
      await client.query(sql);
    }
    await client.query("commit");
    console.log("All migrations applied successfully.");
  } catch (err) {
    await client.query("rollback");
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();


