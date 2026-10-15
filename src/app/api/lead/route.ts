import { NextResponse } from "next/server";
import { overLimit } from "@/lib/db/rate-limit";
import type { Lead } from "@/lib/lead-delivery";
import { recordLead } from "@/lib/leads-service";

const MAX = { name: 120, contact: 160, message: 2000, short: 80 } as const;
const MAX_BODY_CHARS = 20_000;

// Flood guard: 5 requests per 10 minutes per client. Kept in the database so it works on serverless hosting;
// if the database is unreachable it falls back to a per-process counter.
const WINDOW_MIN = 10;
const MAX_PER_WINDOW = 5;
const memory = new Map<string, number[]>();

async function tooMany(key: string): Promise<boolean> {
  try {
    return await overLimit(`lead:${key}`, MAX_PER_WINDOW, WINDOW_MIN);
  } catch {
    const now = Date.now();
    const recent = (memory.get(key) ?? []).filter((t) => now - t < WINDOW_MIN * 60_000);
    memory.set(key, recent.length >= MAX_PER_WINDOW ? recent : [...recent, now]);
    return recent.length >= MAX_PER_WINDOW;
  }
}

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_CHARS) return NextResponse.json({ ok: false }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) return NextResponse.json({ ok: false }, { status: 400 });

  // Honeypot: bots fill the hidden field. Pretend success so they do not retry.
  if (clean(body.website, 50)) return NextResponse.json({ ok: true });

  const lead: Lead = {
    name: clean(body.name, MAX.name),
    contact: clean(body.contact, MAX.contact),
    message: clean(body.message, MAX.message),
    model: clean(body.model, MAX.short),
    calc: clean(body.calc, 400),
    lang: clean(body.lang, 5),
    page: clean(body.page, 120),
  };
  if (!lead.name || !lead.contact) return NextResponse.json({ ok: false }, { status: 422 });

  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await tooMany(client)) return NextResponse.json({ ok: false }, { status: 429 });

  const source = body.source === "quick" ? "quick" : "contact";
  const result = await recordLead({ ...lead, source });
  if (!result.configured) {
    console.error("Neither e-mail nor the database is available; lead was not delivered");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!result.ok) return NextResponse.json({ ok: false }, { status: 502 });
  return NextResponse.json({ ok: true });
}
