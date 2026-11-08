import { createRequire } from "node:module";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const require = createRequire(new URL("../../lib/db/package.json", import.meta.url));
const { Client } = require("pg");

export function validateNeonUrl(value) {
  if (!value) throw new Error("Set DATABASE_URL in Render Environment using the Neon connection string.");
  let url;
  try { url = new URL(value); } catch { throw new Error("Invalid DATABASE_URL."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname.endsWith(".neon.tech")) {
    throw new Error("Portable initialization accepts only a Neon PostgreSQL database, never the current Replit database.");
  }
  if (!["require", "verify-full"].includes(url.searchParams.get("sslmode"))) {
    throw new Error("The Neon connection string must include sslmode=require or sslmode=verify-full.");
  }
}

export async function initializeDatabase() {
  validateNeonUrl(process.env.DATABASE_URL);
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 30000 });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(77191342)");
    await client.query(`CREATE TABLE IF NOT EXISTS portable_schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    const dir = new URL("./migrations/", import.meta.url);
    const names = (await readdir(dir)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
    const { rows: applied } = await client.query("SELECT name,checksum FROM portable_schema_migrations ORDER BY name");
    if (applied.some((row) => !names.includes(row.name))) throw new Error("Database has newer migrations; refusing a downgrade.");
    if (!applied.length) {
      const { rows } = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'math_%'");
      if (rows.length) throw new Error("Existing learning tables found. Stop and arrange a reviewed data migration; no tables were changed.");
    }
    for (const name of names) {
      const sql = await readFile(new URL(name, dir), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previous = applied.find((row) => row.name === name);
      if (previous) {
        if (previous.checksum !== checksum) throw new Error(`Migration ${name} changed after application. Refusing startup.`);
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO portable_schema_migrations(name,checksum) VALUES($1,$2)", [name, checksum]);
    }
    await client.query("COMMIT");
  } catch {
    await client.query("ROLLBACK").catch(() => {});
    // Never include driver error objects: they can contain connection credentials.
    throw new Error("Neon database initialization failed. Check connectivity, permissions and schema compatibility. No partial migration was committed.");
  } finally {
    await client.end();
  }
}
