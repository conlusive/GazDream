// Shape, defaults and validation of the settings the owner can change in the admin.
// Pure functions only (no database, no Next), so they are easy to unit-test and safe to import anywhere.
import type { Fuel, FuelUse } from "@/lib/calculator";
import type { Crop, Currency } from "@/lib/calculator/config";

export const FUELS: Fuel[] = ["gas", "chips", "pellets"];
export const CROP_KEYS: Crop[] = ["corn", "soy", "rapeseed"];
export const CURRENCY_KEYS: Currency[] = ["EUR", "PLN"];
export const VAT_LANGS = ["pl", "de", "en", "uk"] as const;

export type PriceTable = Record<Currency, Record<Fuel, number>>;
export type Prices = { updatedAt: string; table: PriceTable };
/** Consumption per 1 tonne of grain per 1% of moisture removed: gas in m³, chips and pellets in kg. */
export type FuelUseHuman = Record<Crop, Record<Fuel, number>>;
export type CropDefaults = Record<Crop, { start: number; target: number }>;
export type VatRates = Record<(typeof VAT_LANGS)[number], number>; // 0.23 = 23%
export type Contacts = { phone: string; email: string; officePhone: string; officeEmail: string };

export type Settings = {
  prices: Prices;
  fuelUse: FuelUseHuman;
  crops: CropDefaults;
  vat: VatRates;
  contacts: Contacts;
};

export const DEFAULT_SETTINGS: Settings = {
  prices: {
    updatedAt: "2026-10-14",
    table: {
      EUR: { gas: 400, chips: 70, pellets: 160 },
      PLN: { gas: 1700, chips: 300, pellets: 690 },
    },
  },
  // Published corn figures from the previous site (2023). Soy and rapeseed reuse them until the
  // technical specialist provides their own numbers.
  fuelUse: {
    corn: { gas: 1.2, chips: 2.5, pellets: 2.5 },
    soy: { gas: 1.2, chips: 2.5, pellets: 2.5 },
    rapeseed: { gas: 1.2, chips: 2.5, pellets: 2.5 },
  },
  crops: {
    corn: { start: 20, target: 14 },
    soy: { start: 18, target: 13 },
    rapeseed: { start: 12, target: 8 },
  },
  vat: { pl: 0.23, de: 0.19, en: 0.2, uk: 0.23 },
  contacts: {
    phone: "+48 601 073 119",
    email: "sales@strasslider.com",
    officePhone: "+48 661 626 609",
    officeEmail: "office@strasslider.com",
  },
};

/** Calculator units: gas in 1000 m³, chips and pellets in tonnes. */
export const fuelUseForCalc = (human: Record<Fuel, number>): FuelUse => ({
  gas: human.gas / 1000,
  chips: human.chips / 1000,
  pellets: human.pellets / 1000,
});

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const inRange = (v: unknown, min: number, max: number): v is number => finite(v) && v >= min && v <= max;

export function parsePrices(raw: unknown): PriceTable | null {
  const t = raw as Record<string, Record<string, unknown>> | null;
  if (!t || typeof t !== "object") return null;
  const out = { EUR: {}, PLN: {} } as PriceTable;
  for (const c of CURRENCY_KEYS) for (const f of FUELS) {
    const v = t[c]?.[f];
    if (!inRange(v, 0.01, 100_000)) return null;
    out[c][f] = v;
  }
  return out;
}

export function parseFuelUse(raw: unknown): FuelUseHuman | null {
  const t = raw as Record<string, Record<string, unknown>> | null;
  if (!t || typeof t !== "object") return null;
  const out = {} as FuelUseHuman;
  for (const c of CROP_KEYS) {
    out[c] = {} as Record<Fuel, number>;
    for (const f of FUELS) {
      const v = t[c]?.[f];
      if (!inRange(v, 0.001, 1000)) return null;
      out[c][f] = v;
    }
  }
  return out;
}

export function parseCrops(raw: unknown): CropDefaults | null {
  const t = raw as Record<string, Record<string, unknown>> | null;
  if (!t || typeof t !== "object") return null;
  const out = {} as CropDefaults;
  for (const c of CROP_KEYS) {
    const start = t[c]?.start, target = t[c]?.target;
    if (!inRange(start, 1, 40) || !inRange(target, 1, 25) || (target as number) >= (start as number)) return null;
    out[c] = { start: start as number, target: target as number };
  }
  return out;
}

export function parseVat(raw: unknown): VatRates | null {
  const t = raw as Record<string, unknown> | null;
  if (!t || typeof t !== "object") return null;
  const out = {} as VatRates;
  for (const l of VAT_LANGS) {
    const v = t[l];
    if (!inRange(v, 0, 0.5)) return null;
    out[l] = v as number;
  }
  return out;
}

const PHONE = /^\+?[0-9 ()\-]{6,24}$/;
const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

export function parseContacts(raw: unknown): Contacts | null {
  const t = raw as Record<string, unknown> | null;
  if (!t || typeof t !== "object") return null;
  const phone = String(t.phone ?? "").trim(), officePhone = String(t.officePhone ?? "").trim();
  const email = String(t.email ?? "").trim(), officeEmail = String(t.officeEmail ?? "").trim();
  if (!PHONE.test(phone) || !PHONE.test(officePhone) || !EMAIL.test(email) || !EMAIL.test(officeEmail)) return null;
  return { phone, email, officePhone, officeEmail };
}

/** tel: link target: digits and a leading plus only. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/** Fills anything missing or invalid with defaults, so a damaged row can never break the public site. */
export function mergeSettings(stored: Partial<Record<keyof Settings, unknown>>): Settings {
  const p = stored.prices as { updatedAt?: unknown; table?: unknown } | undefined;
  const table = parsePrices(p?.table);
  const updatedAt = typeof p?.updatedAt === "string" && /^\d{4}-\d{2}-\d{2}/.test(p.updatedAt) ? p.updatedAt.slice(0, 10) : DEFAULT_SETTINGS.prices.updatedAt;
  return {
    prices: table ? { updatedAt, table } : DEFAULT_SETTINGS.prices,
    fuelUse: parseFuelUse(stored.fuelUse) ?? DEFAULT_SETTINGS.fuelUse,
    crops: parseCrops(stored.crops) ?? DEFAULT_SETTINGS.crops,
    vat: parseVat(stored.vat) ?? DEFAULT_SETTINGS.vat,
    contacts: parseContacts(stored.contacts) ?? DEFAULT_SETTINGS.contacts,
  };
}
