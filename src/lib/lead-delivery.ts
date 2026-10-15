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

type Deps = { createTransport?: typeof nodemailer.createTransport };

const TIMEOUT_MS = 10_000;
// Recipient-facing labels live here so they are easy to change.
const LABELS = { name: "Imię i nazwisko", contact: "Kontakt", message: "Wiadomość", model: "Model", calc: "Obliczenia", lang: "Język strony", page: "Strona" };

export function formatLead(lead: Lead, receivedAt = new Date()): string {
  const rows = (Object.keys(LABELS) as (keyof typeof LABELS)[])
    .filter((k) => lead[k])
    .map((k) => `${LABELS[k]}: ${lead[k]}`);
  return [`Nowe zapytanie ze strony Eco Straßmayr Energy (${receivedAt.toISOString()})`, ...rows].join("\n");
}

export const isEmail = (v: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(v);

/** E-mail is the only delivery channel. It is configured when host, recipient and sender are all set. */
export const emailConfigured = (env: Env) => Boolean(env.SMTP_HOST && env.LEADS_EMAIL_TO && (env.LEADS_EMAIL_FROM || env.SMTP_USER));

function makeTransport(env: Env, createTransport: typeof nodemailer.createTransport) {
  const port = Number(env.SMTP_PORT ?? 587);
  return createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    connectionTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
}

/** Sends a calculator report to the visitor. Returns false when mail is not configured or sending fails. */
export async function sendReportEmail(
  message: { to: string; subject: string; text: string },
  env: Env = process.env,
  deps: Deps = {},
): Promise<boolean> {
  if (!emailConfigured(env) || !isEmail(message.to)) return false;
  const createTransport = deps.createTransport ?? nodemailer.createTransport.bind(nodemailer);
  try {
    await makeTransport(env, createTransport).sendMail({
      from: env.LEADS_EMAIL_FROM ?? env.SMTP_USER,
      to: message.to,
      subject: message.subject.slice(0, 150),
      text: message.text,
      replyTo: env.LEADS_EMAIL_TO,
    });
    return true;
  } catch (err) {
    console.error("Report e-mail failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

async function sendEmail(lead: Lead, env: Env, createTransport: typeof nodemailer.createTransport) {
  const transport = makeTransport(env, createTransport);
  await transport.sendMail({
    from: env.LEADS_EMAIL_FROM ?? env.SMTP_USER,
    to: env.LEADS_EMAIL_TO,
    subject: `Nowe zapytanie: ${lead.name}`.slice(0, 120),
    text: formatLead(lead),
    // Reply goes to the customer only when the contact is a clean e-mail address.
    replyTo: isEmail(lead.contact) ? lead.contact : undefined,
  });
}

export async function deliverLead(lead: Lead, env: Env = process.env, deps: Deps = {}): Promise<DeliveryResult> {
  if (!emailConfigured(env)) return { configured: [], delivered: [], failed: [] };
  const createTransport = deps.createTransport ?? nodemailer.createTransport.bind(nodemailer);
  try {
    await sendEmail(lead, env, createTransport);
    return { configured: ["email"], delivered: ["email"], failed: [] };
  } catch (err) {
    console.error("Lead e-mail failed:", err instanceof Error ? err.message : err);
    return { configured: ["email"], delivered: [], failed: ["email"] };
  }
}
