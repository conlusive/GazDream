import "server-only";
import { getDb } from "./index";
import { DEFAULT_SETTINGS, mergeSettings, type Settings } from "@/lib/settings-schema";

type Key = keyof Settings;

/** Reads all settings from the database (never cached here). Missing or damaged rows fall back to defaults. */
export async function readSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.query<{ key: string; value: unknown }>("SELECT key, value FROM settings");
  const stored: Partial<Record<Key, unknown>> = {};
  for (const r of rows) stored[r.key as Key] = r.value;
  return mergeSettings(stored);
}

export async function writeSetting(key: Key, value: unknown) {
  const db = await getDb();
  await db.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

export async function writePrices(table: Settings["prices"]["table"], userId: number | null) {
  const prices = { updatedAt: new Date().toISOString().slice(0, 10), table };
  await writeSetting("prices", prices);
  const db = await getDb();
  await db.query("INSERT INTO price_history (user_id, prices) VALUES ($1, $2::jsonb)", [userId, JSON.stringify(prices)]);
  return prices;
}

export type PriceHistoryRow = { id: number; created_at: Date | string; prices: Settings["prices"]; author: string | null };

export async function readPriceHistory(limit = 20): Promise<PriceHistoryRow[]> {
  const db = await getDb();
  return db.query<PriceHistoryRow>(
    `SELECT h.id, h.created_at, h.prices, u.name AS author
       FROM price_history h LEFT JOIN users u ON u.id = h.user_id ORDER BY h.created_at DESC, h.id DESC LIMIT $1`,
    [limit],
  );
}

export { DEFAULT_SETTINGS };
