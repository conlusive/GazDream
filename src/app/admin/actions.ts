"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/admin-auth";
import { CURRENCIES, FUELS, PRICES_TAG, parsePrices, writePrices, type PriceTable } from "@/lib/prices";

export type FormState = { error?: string; ok?: boolean };

// Best-effort brute-force guard (per server instance, in memory).
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const key = await clientKey();
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
    return { error: "Забагато спроб. Спробуйте за 15 хвилин." };
  }

  const password = form.get("password");
  if (typeof password !== "string" || !checkPassword(password)) {
    const fresh = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, { ...fresh, count: fresh.count + 1 });
    return { error: "Невірний пароль." };
  }

  attempts.delete(key);
  await startSession();
  return { ok: true };
}

export async function logout(): Promise<void> {
  await endSession();
}

const toNumber = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? Number(v.trim().replace(",", ".")) : NaN;

export async function savePrices(_prev: FormState, form: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: "Сесія завершилась. Увійдіть знову." };

  const table = { EUR: {}, PLN: {} } as PriceTable;
  for (const c of CURRENCIES) {
    for (const f of FUELS) table[c][f] = toNumber(form.get(`${c}_${f}`));
  }
  const parsed = parsePrices({ updatedAt: new Date().toISOString().slice(0, 10), table });
  if (!parsed) return { error: "Усі ціни мають бути числами більше нуля (до 100 000)." };

  try {
    await writePrices(parsed);
  } catch (err) {
    console.error("Failed to write prices", err);
    return { error: "Не вдалося зберегти файл цін на сервері." };
  }
  updateTag(PRICES_TAG);
  return { ok: true };
}
