import "server-only";
import path from "node:path";
import { MIGRATIONS } from "./migrations";

export type Row = Record<string, unknown>;
export type Db = {
  query: <T = Row>(sql: string, params?: unknown[]) => Promise<T[]>;
  /** "postgres" = DATABASE_URL (durable), "embedded" = local PGlite files/memory (temporary on serverless). */
  kind: "postgres" | "embedded";
};

// One connection per server process. `globalThis` survives hot reloads in development.
const holder = globalThis as unknown as { __gdDb?: Promise<Db>; __gdPool?: { end: () => Promise<void> } };

async function applyMigrations(db: Db) {
  // Several server instances may start at once on an empty database: only one may migrate at a time.
  await db.query("SELECT pg_advisory_lock(727274)");
  try {
    await migrate(db);
  } finally {
    await db.query("SELECT pg_advisory_unlock(727274)");
  }
}

async function migrate(db: Db) {
  await db.query("CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const done = new Set((await db.query<{ id: number }>("SELECT id FROM schema_migrations")).map((r) => r.id));
  for (const m of MIGRATIONS) {
    if (done.has(m.id)) continue;
    await db.query("BEGIN");
    try {
      // Multi-statement migrations: split on statement boundaries handled by the drivers via simple query mode.
      await runScript(db, m.sql);
      await db.query("INSERT INTO schema_migrations (id, name) VALUES ($1, $2)", [m.id, m.name]);
      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      throw err;
    }
  }
}

// Both drivers run a parameterless multi-statement string in simple-query mode.
const runScript = (db: Db, sql: string) => db.query(sql);

export class DatabaseNotConfigured extends Error {
  constructor() {
    super("DATABASE_URL is not set: serverless hosting has no durable disk, so a real database is required.");
  }
}

/** True where a durable database is mandatory: serverless hosting without DATABASE_URL. */
export const databaseRequiredButMissing = () => Boolean(process.env.VERCEL) && !process.env.DATABASE_URL;

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url && databaseRequiredButMissing()) throw new DatabaseNotConfigured();
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX ?? 3),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
    // Managed databases drop idle connections now and then. Without this handler that would crash the process.
    pool.on("error", (err) => console.error("Database pool error:", err.message));
    holder.__gdPool = pool;
    // A single dedicated client keeps BEGIN/COMMIT of migrations on one connection.
    const db: Db = {
      kind: "postgres",
      query: async (sql, params) => (await pool.query(sql, params as unknown[] | undefined)).rows as never,
    };
    const client = await pool.connect();
    try {
      const mdb: Db = { kind: "postgres", query: async (sql, params) => (await client.query(sql, params as unknown[] | undefined)).rows as never };
      await applyMigrations(mdb);
    } finally {
      client.release();
    }
    return db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), "data", "pglite");
  const lite = new PGlite(dir === "memory" ? undefined : dir);
  await lite.waitReady;
  const db: Db = {
    kind: "embedded",
    query: async (sql, params) => {
      // PGlite: parameterless strings may contain many statements; parametrised ones must be single.
      if (!params || params.length === 0) {
        const results = await lite.exec(sql);
        return (results[results.length - 1]?.rows ?? []) as never;
      }
      return (await lite.query(sql, params)).rows as never;
    },
  };
  await applyMigrations(db);
  return db;
}

export function getDb(): Promise<Db> {
  holder.__gdDb ??= connect().catch((err) => {
    holder.__gdDb = undefined; // allow a retry on the next request
    throw err;
  });
  return holder.__gdDb;
}

/** Test helper: close the pool and drop the cached connection so a fresh one is created next time. */
export async function closeDbForTests() {
  await holder.__gdPool?.end().catch(() => {});
  holder.__gdPool = undefined;
  holder.__gdDb = undefined;
}

export const storageIsDurable = () => Boolean(process.env.DATABASE_URL);
