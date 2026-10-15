import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "./index";
import { overLimit } from "./rate-limit";
import { deleteProject, listAllProjects, listVisibleProjects, saveProject, validateProject } from "./projects";
import {
  addNote, allLeadsForExport, deleteLead, getLead, insertLead, leadsToCsv, leadStats, listLeads, setLeadAssignee, setLeadFollowup, setLeadResult,
  setLeadStatus, validateResult,
} from "./leads";
import { readPriceHistory, readSettings, writePrices, writeSetting } from "./settings";
import { deleteTestimonial, listAllTestimonials, listVisibleTestimonials, saveTestimonial, validateTestimonial } from "./testimonials";
import {
  authenticate, clearFailedLogins, countUsers, createSession, createUser, destroySession, hashPassword, listUsers,
  loginBlocked, recordFailedLogin, setUserActive, setUserPassword, setUserRole, userForSession, verifyPassword,
} from "./users";
import { DEFAULT_SETTINGS } from "@/lib/settings-schema";

beforeAll(async () => {
  await getDb(); // runs the migrations
});

describe("schema", () => {
  it("applies migrations and enables row level security everywhere", async () => {
    const db = await getDb();
    const rls = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('users','leads','settings','sessions','audit_log','testimonials','lead_notes','price_history','login_attempts','rate_hits','projects','lead_events')",
    );
    expect(rls).toHaveLength(12);
    expect(rls.every((r) => r.relrowsecurity)).toBe(true);
    const applied = await db.query("SELECT id FROM schema_migrations ORDER BY id");
    expect(applied.length).toBeGreaterThanOrEqual(5);
  });
});

describe("passwords", () => {
  it("hashes with a random salt and verifies", async () => {
    const a = await hashPassword("Secret12345");
    const b = await hashPassword("Secret12345");
    expect(a).not.toBe(b);
    expect(await verifyPassword("Secret12345", a)).toBe(true);
    expect(await verifyPassword("secret12345", a)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});

describe("users and sessions", () => {
  it("bootstraps the first admin from the environment only while no users exist", async () => {
    expect(await countUsers()).toBe(0);
    expect(await authenticate("admin", "wrong-password1", { ADMIN_PASSWORD: "Boot-strap-1" })).toBeNull();
    expect(await countUsers()).toBe(0);
    const admin = await authenticate("Admin", "Boot-strap-1", { ADMIN_PASSWORD: "Boot-strap-1" });
    expect(admin?.role).toBe("admin");
    expect(await countUsers()).toBe(1);
    // After that the environment password no longer creates anyone.
    expect(await authenticate("other@x.pl", "Boot-strap-1", { ADMIN_PASSWORD: "Boot-strap-1" })).toBeNull();
    expect(await countUsers()).toBe(1);
  });

  it("creates managers with validation, and rejects weak passwords and duplicates", async () => {
    await expect(createUser({ email: "m@x.pl", name: "M", role: "manager", password: "short1" })).rejects.toThrow(/щонайменше/);
    await expect(createUser({ email: "m@x.pl", name: "M", role: "manager", password: "onlyletters" })).rejects.toThrow(/літери та цифри/);
    const u = await createUser({ email: "Manager@X.pl", name: "Anna", role: "manager", password: "Passw0rd-long" });
    expect(u.email).toBe("manager@x.pl");
    await expect(createUser({ email: "manager@x.pl", name: "Dup", role: "manager", password: "Passw0rd-long" })).rejects.toThrow(/вже існує/);
    expect((await authenticate("manager@x.pl", "Passw0rd-long"))?.name).toBe("Anna");
    expect(await authenticate("manager@x.pl", "nope-nope-1")).toBeNull();
  });

  it("sessions: valid, expire on deactivation, destroyed on logout", async () => {
    const user = (await listUsers()).find((u) => u.email === "manager@x.pl")!;
    const { token } = await createSession(user.id);
    expect((await userForSession(token))?.email).toBe("manager@x.pl");
    expect(await userForSession("nonsense")).toBeNull();
    await destroySession(token);
    expect(await userForSession(token)).toBeNull();

    const second = await createSession(user.id);
    await setUserActive(user.id, false);
    expect(await userForSession(second.token)).toBeNull();
    expect(await authenticate("manager@x.pl", "Passw0rd-long")).toBeNull();
    await setUserActive(user.id, true);
  });

  it("password change signs the user out everywhere", async () => {
    const user = (await listUsers()).find((u) => u.email === "manager@x.pl")!;
    const { token } = await createSession(user.id);
    await setUserPassword(user.id, "Another-pass-9");
    expect(await userForSession(token)).toBeNull();
    expect(await authenticate("manager@x.pl", "Another-pass-9")).not.toBeNull();
  });

  it("never lets the last active admin be removed or demoted", async () => {
    const admin = (await listUsers()).find((u) => u.role === "admin")!;
    await expect(setUserActive(admin.id, false)).rejects.toThrow(/останнього адміністратора/);
    await expect(setUserRole(admin.id, "manager")).rejects.toThrow(/хоча б один/);
  });

  it("blocks after repeated failures and clears on success", async () => {
    const keys = ["ip:1.2.3.4", "email:test@x.pl"];
    expect(await loginBlocked(keys)).toBe(false);
    for (let i = 0; i < 5; i++) await recordFailedLogin(keys);
    expect(await loginBlocked(keys)).toBe(true);
    expect(await loginBlocked(["ip:9.9.9.9"])).toBe(false);
    await clearFailedLogins(keys);
    expect(await loginBlocked(keys)).toBe(false);
  });
});

describe("leads", () => {
  it("stores, filters, searches, changes status and keeps notes", async () => {
    const admin = (await listUsers()).find((u) => u.role === "admin")!;
    const a = await insertLead({ name: "Jan Kowalski", contact: "jan@example.pl", message: "Proszę o ofertę", model: "PUT-4", lang: "pl", page: "/pl/contact", source: "contact", mailed: true });
    await insertLead({ name: "Anna", contact: "+48 600 100 200", message: "Obliczenie", lang: "de", page: "/de", source: "quick", mailed: true });
    await insertLead({ name: "x@y.de", contact: "x@y.de", calc: "Mais 1000 t", lang: "de", source: "report", mailed: false });

    expect((await listLeads({})).total).toBe(3);
    expect((await listLeads({ q: "kowalski" })).rows.map((r) => r.id)).toEqual([a]);
    expect((await listLeads({ q: "PUT-4" })).total).toBe(1);
    expect((await listLeads({ lang: "de" })).total).toBe(2);
    expect((await listLeads({ source: "report" })).total).toBe(1);
    expect((await listLeads({ status: "new" })).total).toBe(3);
    expect((await listLeads({ from: "2999-01-01" })).total).toBe(0);
    expect((await listLeads({ q: "%" })).total).toBe(0); // wildcard characters are escaped
    expect((await listLeads({ q: "' OR 1=1 --" })).total).toBe(0);

    await setLeadStatus(a, "in_progress");
    await expect(setLeadStatus(a, "bogus" as never)).rejects.toThrow();
    await addNote(a, admin.id, "Zadzwoniono, oddzwoni jutro");
    await expect(addNote(a, admin.id, "   ")).rejects.toThrow();
    const full = await getLead(a);
    expect(full?.lead.status).toBe("in_progress");
    expect(full?.notes[0].text).toContain("Zadzwoniono");
    expect(full?.notes[0].author).toBe("Адміністратор");
    expect(await getLead(99999)).toBeNull();

    const stats = await leadStats();
    expect(stats.total).toBe(3);
    expect(stats.byStatus.in_progress).toBe(1);
    expect(stats.perDay).toHaveLength(14);
    expect(stats.perDay[13].n).toBe(3);

    await setLeadStatus(a, "spam");
    expect((await leadStats()).total).toBe(2); // spam is excluded from the figures
    await deleteLead(a);
    expect(await getLead(a)).toBeNull();
  });

  it("exports CSV that is safe to open in a spreadsheet", async () => {
    await insertLead({ name: "=HYPERLINK(\"http://evil\")", contact: "a@b.pl", message: 'He said "hi", ok', source: "contact", mailed: true });
    const csv = leadsToCsv(await allLeadsForExport({ q: "HYPERLINK" }));
    expect(csv.startsWith("﻿id,created_at")).toBe(true);
    expect(csv).toContain("\"'=HYPERLINK(");
    expect(csv).toContain('"He said ""hi"", ok"');
  });
});

describe("settings", () => {
  it("falls back to defaults, stores prices with history, ignores damaged rows", async () => {
    expect((await readSettings()).prices.table.EUR.gas).toBe(DEFAULT_SETTINGS.prices.table.EUR.gas);
    const table = { EUR: { gas: 455, chips: 80, pellets: 170 }, PLN: { gas: 1800, chips: 330.5, pellets: 700 } };
    await writePrices(table, null);
    const s = await readSettings();
    expect(s.prices.table.PLN.chips).toBe(330.5);
    expect(await readPriceHistory()).toHaveLength(1);

    await writeSetting("vat", { pl: "lots" }); // damaged value
    expect((await readSettings()).vat).toEqual(DEFAULT_SETTINGS.vat);
    await writeSetting("contacts", { ...DEFAULT_SETTINGS.contacts, phone: "+48 111 222 333" });
    expect((await readSettings()).contacts.phone).toBe("+48 111 222 333");
  });
});

describe("testimonials", () => {
  it("validates, shows only visible ones for the language, and deletes", async () => {
    expect(() => validateTestimonial({ quote: "short", author: "A" })).toThrow();
    expect(() => validateTestimonial({ quote: "A long enough quote here", author: "" })).toThrow();
    await saveTestimonial(null, validateTestimonial({ quote: "Piec działa świetnie od dwóch sezonów.", author: "Jan, Rolnik", lang: "pl" }));
    await saveTestimonial(null, validateTestimonial({ quote: "Works great for two seasons now.", author: "Tom", lang: "en" }));
    await saveTestimonial(null, validateTestimonial({ quote: "Hidden quote that nobody sees.", author: "Ghost", lang: "all", visible: false }));
    expect((await listVisibleTestimonials("pl")).map((t) => t.author)).toEqual(["Jan, Rolnik"]);
    expect((await listVisibleTestimonials("en")).map((t) => t.author)).toEqual(["Tom"]);
    const all = await listAllTestimonials();
    expect(all).toHaveLength(3);
    await deleteTestimonial(all[0].id);
    expect(await listAllTestimonials()).toHaveLength(2);
  });
});

describe("rate limit", () => {
  it("allows up to the limit, then blocks, per key", async () => {
    for (let i = 0; i < 3; i++) expect(await overLimit("lead:1.1.1.1", 3, 10)).toBe(false);
    expect(await overLimit("lead:1.1.1.1", 3, 10)).toBe(true);
    expect(await overLimit("lead:2.2.2.2", 3, 10)).toBe(false); // other clients are unaffected
    expect(await overLimit("report:1.1.1.1", 3, 10)).toBe(false); // other buckets too
  });
});

describe("projects", () => {
  it("starts with the six installations from the old site", async () => {
    const all = await listAllProjects();
    expect(all).toHaveLength(6);
    expect(all[0].location_pl).toBe("Obwód sumski, Ukraina");
    expect(all.find((p) => p.location_pl.startsWith("Katowice"))?.power_mw).toBe("2,5");
  });

  it("adds, edits, hides and deletes a project", async () => {
    await saveProject(null, validateProject({ location_pl: "Opole, Polska", location_en: "Opole, Poland", power_mw: "3.5", fuel: "chips", per_day: "300-350", sort: 99 }));
    const added = (await listAllProjects()).find((p) => p.location_pl === "Opole, Polska")!;
    expect(added.power_mw).toBe("3,5"); // decimal point becomes the comma used on the site
    expect(added.per_day).toBe("300–350");
    expect(added.location_de).toBe("");

    await saveProject(added.id, validateProject({ ...added, visible: false, dryer: "Sukup" }));
    expect((await listVisibleProjects()).some((p) => p.id === added.id)).toBe(false);
    expect((await listAllProjects()).find((p) => p.id === added.id)?.dryer).toBe("Sukup");

    await deleteProject(added.id);
    expect((await listAllProjects()).some((p) => p.id === added.id)).toBe(false);
  });

  it("rejects bad input with a readable message", () => {
    expect(() => validateProject({ location_pl: "", power_mw: "5" })).toThrow(/польською/);
    expect(() => validateProject({ location_pl: "X", power_mw: "abc" })).toThrow(/Потужність/);
    expect(() => validateProject({ location_pl: "X", power_mw: "0" })).toThrow(/Потужність/);
    expect(() => validateProject({ location_pl: "X", power_mw: "5", per_day: "lots" })).toThrow(/Продуктивність/);
  });
});

describe("lead handling", () => {
  it("assigns, schedules the next contact, records the outcome and keeps a history", async () => {
    const admin = (await listUsers()).find((u) => u.role === "admin")!;
    const id = await insertLead({ name: "Handling Test", contact: "handling@example.pl", lang: "pl", source: "contact", mailed: true });
    const before = await leadStats();

    // Assignee: must be an active user; setting the same value again is not a change.
    await setLeadAssignee(id, admin.id, admin.id);
    await setLeadAssignee(id, admin.id, admin.id);
    await expect(setLeadAssignee(id, 999999, admin.id)).rejects.toThrow(/не знайдено/);
    expect((await listLeads({ assignee: String(admin.id) })).rows.map((r) => r.id)).toContain(id);
    expect((await listLeads({ assignee: "none" })).rows.map((r) => r.id)).not.toContain(id);
    expect((await getLead(id))?.lead.assignee_name).toBe(admin.name);

    // Next contact: a past date makes the open lead "due"; a future date does not.
    await setLeadFollowup(id, "2020-01-01", admin.id);
    expect((await listLeads({ due: "1" })).rows.map((r) => r.id)).toContain(id);
    expect((await leadStats()).due).toBe(before.due + 1);
    expect((await getLead(id))?.lead.next_contact).toBe("2020-01-01");
    await setLeadFollowup(id, "2999-01-01", admin.id);
    expect((await listLeads({ due: "1" })).rows.map((r) => r.id)).not.toContain(id);
    await expect(setLeadFollowup(id, "not-a-date", admin.id)).rejects.toThrow(/дата/);
    await expect(setLeadFollowup(id, "2026-02-31", admin.id)).rejects.toThrow(/дата/);
    await setLeadFollowup(id, "2020-01-01", admin.id);

    // Outcome: only for won/lost leads; a finished lead is no longer "due".
    await expect(setLeadResult(id, validateResult("won", { dealValue: "1" }), admin.id)).rejects.toThrow(/Спершу/);
    await setLeadStatus(id, "won", admin.id);
    expect((await listLeads({ due: "1" })).rows.map((r) => r.id)).not.toContain(id);
    await setLeadResult(id, validateResult("won", { dealValue: "12 500,50", currency: "PLN" }), admin.id);
    const won = (await getLead(id))!.lead;
    expect(won.deal_value).toBe(12500.5);
    expect(won.deal_currency).toBe("PLN");
    expect((await leadStats()).deals.find((d) => d.currency === "PLN")?.sum).toBeGreaterThanOrEqual(12500.5);

    await setLeadStatus(id, "lost", admin.id);
    await setLeadResult(id, validateResult("lost", { lostReason: "Дорого" }), admin.id);
    expect((await getLead(id))!.lead.lost_reason).toBe("Дорого");
    expect((await leadStats()).lostReasons.find((r) => r.reason === "Дорого")?.n).toBeGreaterThanOrEqual(1);

    // History: who did what, in order, without duplicates for no-op changes.
    const events = (await getLead(id))!.events.map((e) => `${e.kind}:${e.from_value}>${e.to_value}`);
    expect(events).toEqual([
      `assignee:>${admin.name}`,
      "followup:>2020-01-01",
      "followup:2020-01-01>2999-01-01",
      "followup:2999-01-01>2020-01-01",
      "status:new>won",
      "result:>12500.5 PLN",
      "status:won>lost",
      "result:>Дорого",
    ]);
    expect((await getLead(id))!.events[0].author).toBe(admin.name);

    // The export carries the new columns.
    const csv = leadsToCsv(await allLeadsForExport({ q: "Handling Test" }));
    expect(csv).toContain("assignee,next_contact,deal_value,deal_currency,lost_reason");
    expect(csv).toContain("Дорого");
  });

  it("validates the outcome input", () => {
    expect(() => validateResult("won", { dealValue: "-5" })).toThrow(/Сума угоди/);
    expect(() => validateResult("won", { dealValue: "abc" })).toThrow(/Сума угоди/);
    expect(validateResult("won", { dealValue: "" }).dealValue).toBeNull();
    expect(() => validateResult("lost", { lostReason: "щось своє" })).toThrow(/зі списку/);
    expect(() => validateResult("new", {})).toThrow(/лише/);
  });
});
