import { describe, expect, it, vi } from "vitest";
import { deliverLead, formatLead, type Lead } from "./lead-delivery";

const lead: Lead = {
  name: "Jan Kowalski",
  contact: "jan@example.pl",
  message: "Proszę o ofertę",
  model: "PUT-4",
  calc: "Kukurydza 1000 t",
  lang: "pl",
  page: "/pl/contact",
};
const ok = () => Promise.resolve(new Response("ok", { status: 200 }));
const fail = () => Promise.resolve(new Response("no", { status: 500 }));

describe("formatLead", () => {
  it("lists only the filled fields", () => {
    const text = formatLead({ ...lead, model: "", calc: "" }, new Date("2026-10-14T10:00:00Z"));
    expect(text).toContain("Нова заявка GazDream (2026-10-14T10:00:00.000Z)");
    expect(text).toContain("Ім'я: Jan Kowalski");
    expect(text).not.toContain("Модель");
  });
});

describe("deliverLead", () => {
  it("reports nothing configured when no channel env is set", async () => {
    const r = await deliverLead(lead, {}, { fetch: vi.fn() as never });
    expect(r).toEqual({ configured: [], delivered: [], failed: [] });
  });

  it("sends Telegram as plain text to the right chat", async () => {
    const fetchMock = vi.fn(ok);
    const r = await deliverLead(lead, { TELEGRAM_BOT_TOKEN: "123:abc", TELEGRAM_CHAT_ID: "-100" }, { fetch: fetchMock as never });
    expect(r.delivered).toEqual(["telegram"]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/bot123:abc/sendMessage");
    const body = JSON.parse(init.body as string);
    expect(body.chat_id).toBe("-100");
    expect(body.parse_mode).toBeUndefined();
    expect(body.text).toContain("Jan Kowalski");
  });

  it("truncates very long Telegram text under the API limit", async () => {
    const fetchMock = vi.fn(ok);
    await deliverLead({ ...lead, message: "x".repeat(10_000) }, { TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1" }, { fetch: fetchMock as never });
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.text.length).toBeLessThanOrEqual(4096);
  });

  it("counts a lead as delivered when one channel fails and another succeeds", async () => {
    const fetchMock = vi.fn((url: string) => (url.includes("telegram") ? fail() : ok()));
    const r = await deliverLead(
      lead,
      { TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1", LEAD_WEBHOOK_URL: "https://hook.example/x" },
      { fetch: fetchMock as never },
    );
    expect(r.configured.sort()).toEqual(["telegram", "webhook"]);
    expect(r.delivered).toEqual(["webhook"]);
    expect(r.failed).toEqual(["telegram"]);
  });

  it("sends e-mail with reply-to only for a clean address", async () => {
    const sendMail = vi.fn(() => Promise.resolve({}));
    const createTransport = vi.fn(() => ({ sendMail })) as never;
    const env = { SMTP_HOST: "smtp.example", SMTP_USER: "bot@example.pl", SMTP_PASS: "p", LEADS_EMAIL_TO: "sales@example.pl" };

    await deliverLead(lead, env, { createTransport });
    expect(sendMail).toHaveBeenLastCalledWith(expect.objectContaining({ to: "sales@example.pl", from: "bot@example.pl", replyTo: "jan@example.pl" }));

    await deliverLead({ ...lead, contact: "a@b.pl, evil@x.com" }, env, { createTransport });
    expect(sendMail).toHaveBeenLastCalledWith(expect.objectContaining({ replyTo: undefined }));
    await deliverLead({ ...lead, contact: "+48 600 100 200" }, env, { createTransport });
    expect(sendMail).toHaveBeenLastCalledWith(expect.objectContaining({ replyTo: undefined }));
  });

  it("does not enable the e-mail channel without a recipient", async () => {
    const r = await deliverLead(lead, { SMTP_HOST: "smtp.example", SMTP_USER: "u" }, {});
    expect(r.configured).toEqual([]);
  });
});
