import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Production talks to Postgres through the `pg` driver (DATABASE_URL). This starts a Postgres-protocol
 * server in front of an in-memory database and runs the real code path against it: connection pool,
 * multi-statement migrations on one connection, parameters, JSONB and timestamps.
 */
const PORT = 54329;
let server: PGLiteSocketServer;
let lite: PGlite;

beforeAll(async () => {
  lite = new PGlite();
  await lite.waitReady;
  server = new PGLiteSocketServer({ db: lite, port: PORT, host: "127.0.0.1" });
  await server.start();
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;
  vi.resetModules();
});

afterAll(async () => {
  const { closeDbForTests } = await import("./index");
  await closeDbForTests();
  delete process.env.DATABASE_URL;
  await server.stop();
  await lite.close();
});

describe("pg driver against a Postgres-protocol server", () => {
  it("connects, migrates, and serves the repositories", async () => {
    const { getDb, storageIsDurable } = await import("./index");
    const db = await getDb();
    expect(db.kind).toBe("postgres");
    expect(storageIsDurable()).toBe(true);

    const applied = await db.query<{ id: number }>("SELECT id FROM schema_migrations ORDER BY id");
    expect(applied.map((r) => r.id)).toEqual([1, 2]);

    const { insertLead, listLeads, setLeadStatus, leadStats } = await import("./leads");
    const id = await insertLead({ name: "Pg Test", contact: "pg@example.pl", message: "hello 'quoted' \"text\"", source: "contact", mailed: true });
    expect((await listLeads({ q: "quoted" })).rows[0].id).toBe(id);
    await setLeadStatus(id, "closed");
    expect((await leadStats()).byStatus.closed).toBe(1);

    const { writePrices, readSettings } = await import("./settings");
    await writePrices({ EUR: { gas: 1, chips: 2, pellets: 3 }, PLN: { gas: 4, chips: 5, pellets: 6 } }, null);
    expect((await readSettings()).prices.table.PLN.pellets).toBe(6);

    const { authenticate, createSession, userForSession } = await import("./users");
    const user = await authenticate("admin", "Pg-Bootstrap-1", { ADMIN_PASSWORD: "Pg-Bootstrap-1" });
    expect(user?.role).toBe("admin");
    const { token } = await createSession(user!.id);
    expect((await userForSession(token))?.email).toBe("admin");
  });

  it("re-running the migrations is a no-op", async () => {
    const { getDb } = await import("./index");
    const db = await getDb();
    const before = await db.query("SELECT id FROM schema_migrations");
    expect(before).toHaveLength(2);
  });
});
