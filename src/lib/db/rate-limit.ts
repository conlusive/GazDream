import "server-only";
import { getDb } from "./index";

/**
 * Counts a hit for `key` and tells whether it is over the limit. Stored in the database, so it holds
 * across serverless instances. Hits older than the window do not count; old rows are cleaned up.
 */
export async function overLimit(key: string, max: number, windowMinutes: number): Promise<boolean> {
  const db = await getDb();
  const rows = await db.query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM rate_hits WHERE key = $1 AND at > now() - ($2 || ' minutes')::interval",
    [key, String(windowMinutes)],
  );
  if (Number(rows[0].n) >= max) return true;
  await db.query("INSERT INTO rate_hits (key) VALUES ($1)", [key]);
  await db.query("DELETE FROM rate_hits WHERE at < now() - interval '1 day'");
  return false;
}
