import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

export type Lead = {
  name: string;
  contact: string;
  message: string;
  model: string;
  calc: string;
  lang: string;
  page: string;
};

export type Env = Record<string, string | undefined>;
export type DeliveryResult = { configured: string[]; delivered: string[]; failed: string[] };

type Deps = {
  fetch?: typeof fetch;
  createTransport?: typeof nodemailer.createTransport;
};

const TIMEOUT_MS = 8000;
const TELEGRAM_LIMIT = 3900; // API hard limit is 4096
// Manager-facing labels live here so they are easy to change.
const LABELS = { name: "Ім'я", contact: "Контакт", message: "Повідомлення", model: "Модель", calc: "Розрахунок", lang: "Мова сайту", page: "Сторінка" };

export function formatLead(lead: Lead, receivedAt = new Date()): string {
  const rows = (Object.keys(LABELS) as (keyof typeof LABELS)[])
    .filter((k) => lead[k])
    .map((k) => `${LABELS[k]}: ${lead[k]}`);
  return [`Нова заявка GazDream (${receivedAt.toISOString()})`, ...rows].join("\n");
}

const isEmail = (v: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(v);

async function sendWebhook(lead: Lead, env: Env, doFetch: typeof fetch) {
  const res = await doFetch(env.LEAD_WEBHOOK_URL as string, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...lead, receivedAt: new Date().toISOString() }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`webhook ${res.status}`);
}

async function sendTelegram(lead: Lead, env: Env, doFetch: typeof fetch) {
  const base = env.TELEGRAM_API_BASE ?? "https://api.telegram.org";
  // No parse_mode: the text is sent as plain text, so user input cannot inject markup.
  const res = await doFetch(`${base}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: formatLead(lead).slice(0, TELEGRAM_LIMIT) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}`);
}

async function sendEmail(lead: Lead, env: Env, createTransport: typeof nodemailer.createTransport) {
  const port = Number(env.SMTP_PORT ?? 587);
  const transport = createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
  await transport.sendMail({
    from: env.LEADS_EMAIL_FROM ?? env.SMTP_USER,
    to: env.LEADS_EMAIL_TO,
    subject: `Нова заявка GazDream: ${lead.name}`.slice(0, 120),
    text: formatLead(lead),
    // Reply goes to the customer only when the contact is a clean e-mail address.
    replyTo: isEmail(lead.contact) ? lead.contact : undefined,
  });
}

/** Sends the lead to every configured channel in parallel. Delivered means at least one succeeded. */
export async function deliverLead(lead: Lead, env: Env = process.env, deps: Deps = {}): Promise<DeliveryResult> {
  const doFetch = deps.fetch ?? fetch;
  const createTransport = deps.createTransport ?? nodemailer.createTransport.bind(nodemailer);

  const channels: { name: string; run: () => Promise<void> }[] = [];
  if (env.LEAD_WEBHOOK_URL) channels.push({ name: "webhook", run: () => sendWebhook(lead, env, doFetch) });
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) channels.push({ name: "telegram", run: () => sendTelegram(lead, env, doFetch) });
  if (env.SMTP_HOST && env.LEADS_EMAIL_TO && (env.LEADS_EMAIL_FROM || env.SMTP_USER)) {
    channels.push({ name: "email", run: () => sendEmail(lead, env, createTransport) });
  }

  const settled = await Promise.allSettled(channels.map((c) => c.run()));
  const result: DeliveryResult = { configured: channels.map((c) => c.name), delivered: [], failed: [] };
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") result.delivered.push(channels[i].name);
    else {
      result.failed.push(channels[i].name);
      console.error(`Lead delivery failed via ${channels[i].name}:`, s.reason instanceof Error ? s.reason.message : s.reason);
    }
  });
  return result;
}

/** Best-effort local backup so a lead is not lost if every channel is down. Never throws. */
export async function archiveLead(lead: Lead, result: DeliveryResult, env: Env = process.env): Promise<void> {
  try {
    const file = env.LEADS_LOG_FILE ?? path.join(process.cwd(), "data", "leads.jsonl");
    await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
    const line = JSON.stringify({ ...lead, receivedAt: new Date().toISOString(), delivered: result.delivered, failed: result.failed });
    await appendFile(/*turbopackIgnore: true*/ file, line + "\n", "utf8");
  } catch (err) {
    console.error("Could not archive lead", err instanceof Error ? err.message : err);
  }
}
