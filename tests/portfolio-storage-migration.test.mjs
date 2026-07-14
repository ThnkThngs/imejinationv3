import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = new URL("../supabase/migrations/", import.meta.url);
const migrationFile = readdirSync(migrationsDir).find((name) =>
  name.endsWith("_create_portfolio_storage_bucket.sql"),
);

assert.ok(migrationFile, "portfolio storage bucket migration exists");

const sql = readFileSync(join(migrationsDir.pathname, migrationFile), "utf8");

assert.match(sql, /INSERT INTO storage\.buckets/i);
assert.match(sql, /'portfolio'/i);
assert.match(sql, /public,[\s\S]*?VALUES[\s\S]*?true/i);
assert.match(sql, /104857600/);
assert.match(sql, /image\/jpeg/i);
assert.match(sql, /video\/mp4/i);
