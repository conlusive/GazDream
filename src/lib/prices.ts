import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cacheTag } from "next/cache";
import type { Fuel } from "@/lib/calculator";

export type Currency = "EUR" | "PLN";
export type PriceTable = Record<Currency, Record<Fuel, number>>;
export type Prices = { updatedAt: string; table: PriceTable };

export const PRICES_TAG = "prices";
export const FUELS: Fuel[] = ["gas", "chips", "pellets"];
export const CURRENCIES: Currency[] = ["EUR", "PLN"];

// Placeholder market prices used until the owner saves real ones in /admin.
export const DEFAULT_PRICES: Prices = {
  updatedAt: "2026-10-14",
  table: {
    EUR: { gas: 400, chips: 70, pellets: 160 },
    PLN: { gas: 1700, chips: 300, pellets: 690 },
  },
};

const filePath = () => process.env.PRICES_FILE ?? path.join(process.cwd(), "data", "prices.json");

const validPrice = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0 && v <= 100_000;

export function parsePrices(raw: unknown): Prices | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { updatedAt, table } = raw as { updatedAt?: unknown; table?: Record<string, Record<string, unknown>> };
  if (typeof updatedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(updatedAt) || !table) return null;
  const out = { EUR: {}, PLN: {} } as PriceTable;
  for (const c of CURRENCIES) {
    for (const f of FUELS) {
      const v = table[c]?.[f];
      if (!validPrice(v)) return null;
      out[c][f] = v;
    }
  }
  return { updatedAt, table: out };
}

/** Always reads the file (no caching). Falls back to defaults when missing or invalid. */
export async function readPrices(): Promise<Prices> {
  try {
    return parsePrices(JSON.parse(await readFile(/*turbopackIgnore: true*/ filePath(), "utf8"))) ?? DEFAULT_PRICES;
  } catch {
    return DEFAULT_PRICES;
  }
}

/** Atomic write: temp file + rename so readers never see a half-written file. */
export async function writePrices(prices: Prices): Promise<void> {
  const target = filePath();
  await mkdir(/*turbopackIgnore: true*/ path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(prices, null, 2), "utf8");
  await rename(/*turbopackIgnore: true*/ tmp, /*turbopackIgnore: true*/ target);
}

/** Cached read for public pages; the admin save action expires PRICES_TAG. */
export async function getPrices(): Promise<Prices> {
  "use cache";
  cacheTag(PRICES_TAG);
  return readPrices();
}
