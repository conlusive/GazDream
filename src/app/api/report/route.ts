import { NextResponse } from "next/server";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { hasLocale } from "@/i18n/config";
import { overLimit } from "@/lib/db/rate-limit";
import { recordLead } from "@/lib/leads-service";
import { isEmail, sendReportEmail } from "@/lib/lead-delivery";
import { buildReport, parseReportInput } from "@/lib/report";
import { getSettings } from "@/lib/settings";

const MAX_BODY_CHARS = 5_000;
// 3 reports per 10 minutes per client (stops this from being used to spam strangers). Stored in the
// database so it works on serverless hosting; per-process fallback if the database is unreachable.
const WINDOW_MIN = 10;
const MAX_PER_WINDOW = 3;
const memory = new Map<string, number[]>();
async function tooMany(key: string): Promise<boolean> {
  try {
    return await overLimit(`report:${key}`, MAX_PER_WINDOW, WINDOW_MIN);
  } catch {
    const now = Date.now();
    const recent = (memory.get(key) ?? []).filter((t) => now - t < WINDOW_MIN * 60_000);
    memory.set(key, recent.length >= MAX_PER_WINDOW ? recent : [...recent, now]);
    return recent.length >= MAX_PER_WINDOW;
  }
}

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
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true }); // honeypot

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 160) : "";
  const lang = typeof body.lang === "string" ? body.lang : "";
  const input = parseReportInput(body.input);
  if (!hasLocale(lang) || !isEmail(email) || body.consent !== true || !input) return NextResponse.json({ ok: false }, { status: 422 });

  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (await tooMany(client)) return NextResponse.json({ ok: false }, { status: 429 });

  const [dict, settings] = await Promise.all([getDictionary(lang), getSettings()]);
  const report = buildReport(lang, dict.calc, input, settings);
  const sent = await sendReportEmail({ to: email, subject: dict.calc.reportTitle, text: report.text });
  if (!sent) return NextResponse.json({ ok: false }, { status: 503 });

  // The visitor asked for the report and agreed to be contacted: pass it to sales as a lead as well.
  await recordLead({ name: email, contact: email, message: "Raport z kalkulatora wysłany klientowi", model: "", calc: report.summary.slice(0, 400), lang, page: "/calculator (report)", source: "report" });
  return NextResponse.json({ ok: true });
}
