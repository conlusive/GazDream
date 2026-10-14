import { describe, expect, it, vi } from "vitest";
import { deliverLead, emailConfigured, formatLead, type Lead } from "./lead-delivery";

const lead: Lead = {
  name: "Jan Kowalski",
  contact: "jan@example.pl",
  message: "Proszę o ofertę",
  model: "PUT-4",
  calc: "Kukurydza 1000 t",
  lang: "pl",
  page: "/pl/contact",
};
const env = { SMTP_HOST: "smtp.example", SMTP_USER: "bot@example.pl", SMTP_PASS: "p", LEADS_EMAIL_TO: "sales@example.pl" };
const transportWith = (sendMail: () => Promise<unknown>) => vi.fn(() => ({ sendMail })) as never;

describe("formatLead", () => {
  it("lists only the filled fields", () => {
    const text = formatLead({ ...lead, model: "", calc: "" }, new Date("2026-10-14T10:00:00Z"));
    expect(text).toContain("Nowe zapytanie ze strony Eco Straßmayr Energy (2026-10-14T10:00:00.000Z)");
    expect(text).toContain("Imię i nazwisko: Jan Kowalski");
    expect(text).not.toContain("Model");
  });
});

describe("emailConfigured", () => {
  it("needs host, recipient and a sender", () => {
    expect(emailConfigured({})).toBe(false);
    expect(emailConfigured({ SMTP_HOST: "h", LEADS_EMAIL_TO: "t@x.pl" })).toBe(false);
    expect(emailConfigured({ SMTP_HOST: "h", LEADS_EMAIL_TO: "t@x.pl", LEADS_EMAIL_FROM: "f@x.pl" })).toBe(true);
    expect(emailConfigured(env)).toBe(true);
  });
  it("ignores the old Telegram and webhook settings", () => {
    expect(emailConfigured({ TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1", LEAD_WEBHOOK_URL: "https://x" })).toBe(false);
  });
});

describe("deliverLead", () => {
  it("reports nothing configured without e-mail settings", async () => {
    expect(await deliverLead(lead, {})).toEqual({ configured: [], delivered: [], failed: [] });
  });

  it("sends the e-mail to the configured recipient", async () => {
    const sendMail = vi.fn(() => Promise.resolve({}));
    const r = await deliverLead(lead, env, { createTransport: transportWith(sendMail) });
    expect(r).toEqual({ configured: ["email"], delivered: ["email"], failed: [] });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "sales@example.pl", from: "bot@example.pl", replyTo: "jan@example.pl", subject: "Nowe zapytanie: Jan Kowalski" }));
  });

  it("sets reply-to only for a clean address", async () => {
    const sendMail = vi.fn(() => Promise.resolve({}));
    const deps = { createTransport: transportWith(sendMail) };
    await deliverLead({ ...lead, contact: "a@b.pl, evil@x.com" }, env, deps);
    expect(sendMail).toHaveBeenLastCalledWith(expect.objectContaining({ replyTo: undefined }));
    await deliverLead({ ...lead, contact: "+48 600 100 200" }, env, deps);
    expect(sendMail).toHaveBeenLastCalledWith(expect.objectContaining({ replyTo: undefined }));
  });

  it("reports failure when the mail server rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await deliverLead(lead, env, { createTransport: transportWith(() => Promise.reject(new Error("connect ECONNREFUSED"))) });
    expect(r).toEqual({ configured: ["email"], delivered: [], failed: ["email"] });
  });

  it("uses implicit TLS only on port 465", async () => {
    const sendMail = vi.fn(() => Promise.resolve({}));
    const createTransport = vi.fn(() => ({ sendMail })) as never;
    await deliverLead(lead, { ...env, SMTP_PORT: "465" }, { createTransport });
    await deliverLead(lead, { ...env, SMTP_PORT: "587" }, { createTransport });
    const calls = (createTransport as unknown as { mock: { calls: [{ secure: boolean }][] } }).mock.calls;
    expect(calls[0][0].secure).toBe(true);
    expect(calls[1][0].secure).toBe(false);
  });
});
