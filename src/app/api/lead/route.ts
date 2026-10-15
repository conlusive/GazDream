import { NextResponse } from "next/server";
import type { Lead } from "@/lib/lead-delivery";
import { recordLead } from "@/lib/leads-service";

const MAX = { name: 120, contact: 160, message: 2000, short: 80 } as const;
const MAX_BODY_CHARS = 20_000;

// Best-effort flood guard per server instance: 5 leads per 10 minutes per client.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function tooMany(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  hits.set(key, [...recent, now]);
  return false;
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
  if (tooMany(client)) return NextResponse.json({ ok: false }, { status: 429 });

  const source = body.source === "quick" ? "quick" : "contact";
  const result = await recordLead({ ...lead, source });
  if (!result.configured) {
    console.error("Neither e-mail nor the database is available; lead was not delivered");
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  if (!result.ok) return NextResponse.json({ ok: false }, { status: 502 });
  return NextResponse.json({ ok: true });
}
