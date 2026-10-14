import { NextResponse } from "next/server";

const MAX = { name: 120, contact: 160, message: 2000, short: 80 } as const;

type Lead = {
  name: string;
  contact: string;
  message: string;
  model: string;
  calc: string;
  lang: string;
  page: string;
};

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

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

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) {
    console.error("LEAD_WEBHOOK_URL is not configured; lead was not delivered");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...lead, receivedAt: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
  } catch (err) {
    console.error("Lead delivery failed", err);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
