import "server-only";
import { getDb } from "./index";

export type LeadStatus = "new" | "in_progress" | "won" | "lost" | "spam";
export type LeadSource = "contact" | "quick" | "report";
export const STATUSES: LeadStatus[] = ["new", "in_progress", "won", "lost", "spam"];
export const CURRENCIES = ["EUR", "PLN"] as const;
export type Currency = (typeof CURRENCIES)[number];
/** Fixed list so the loss reasons can be counted. */
export const LOST_REASONS = ["Дорого", "Обрали конкурента", "Немає бюджету чи фінансування", "Не вийшли на зв'язок", "Передумали", "Інше"] as const;
export const SOURCES: LeadSource[] = ["contact", "quick", "report"];

export type Lead = {
  id: number;
  created_at: Date | string;
  updated_at: Date | string;
  name: string;
  contact: string;
  message: string;
  model: string;
  calc: string;
  lang: string;
  page: string;
  source: LeadSource;
  status: LeadStatus;
  mailed: boolean;
  assignee_id: number | null;
  assignee_name: string | null;
  /** YYYY-MM-DD in the company's time zone. */
  next_contact: string | null;
  deal_value: number | null;
  deal_currency: Currency;
  lost_reason: string;
};
export type LeadEvent = { id: number; kind: "status" | "assignee" | "followup" | "result"; from_value: string; to_value: string; created_at: Date | string; author: string | null };
export type Note = { id: number; lead_id: number; user_id: number | null; text: string; created_at: Date | string; author: string | null };

export type NewLead = {
  name: string;
  contact: string;
  message?: string;
  model?: string;
  calc?: string;
  lang?: string;
  page?: string;
  source: LeadSource;
  mailed: boolean;
};

export async function insertLead(l: NewLead): Promise<number> {
  const db = await getDb();
  const rows = await db.query<{ id: number }>(
    `INSERT INTO leads (name, contact, message, model, calc, lang, page, source, mailed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [l.name, l.contact, l.message ?? "", l.model ?? "", l.calc ?? "", l.lang ?? "", l.page ?? "", l.source, l.mailed],
  );
  return rows[0].id;
}

/** Explicit columns: DATE and NUMERIC are cast so every driver returns the same plain strings and numbers. */
const SELECT = `SELECT l.id, l.created_at, l.updated_at, l.name, l.contact, l.message, l.model, l.calc, l.lang, l.page, l.source, l.status, l.mailed,
  l.assignee_id, u.name AS assignee_name, to_char(l.next_contact, 'YYYY-MM-DD') AS next_contact, l.deal_value::float8 AS deal_value, l.deal_currency, l.lost_reason
  FROM leads l LEFT JOIN users u ON u.id = l.assignee_id`;
/** "Today" is the calendar day in Poland, whatever time zone the server runs in. */
const TODAY = "(now() AT TIME ZONE 'Europe/Warsaw')::date";

export type LeadFilter = { q?: string; status?: string; source?: string; lang?: string; from?: string; to?: string; assignee?: string; due?: string };
export const PAGE_SIZE = 25;

const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
/** YYYY-MM-DD that exists in the calendar (2026-02-31 does not). */
const isRealDate = (v: string) => {
  if (!isDate(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};

function where(f: LeadFilter) {
  const parts: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    parts.push(sql.replace("?", `$${params.length}`));
  };
  if (f.q?.trim()) {
    params.push(`%${f.q.trim().slice(0, 80).replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    const n = `$${params.length}`;
    parts.push(`(l.name ILIKE ${n} OR l.contact ILIKE ${n} OR l.message ILIKE ${n} OR l.model ILIKE ${n} OR l.calc ILIKE ${n})`);
  }
  if (f.status && (STATUSES as string[]).includes(f.status)) add("l.status = ?", f.status);
  if (f.source && (SOURCES as string[]).includes(f.source)) add("l.source = ?", f.source);
  if (f.lang && /^[a-z]{2}$/.test(f.lang)) add("l.lang = ?", f.lang);
  if (isDate(f.from)) add("l.created_at >= ?::date", f.from);
  if (isDate(f.to)) add("l.created_at < (?::date + 1)", f.to);
  if (f.assignee === "none") parts.push("l.assignee_id IS NULL");
  else if (f.assignee && /^\d{1,9}$/.test(f.assignee)) add("l.assignee_id = ?", Number(f.assignee));
  // "Due": an open lead whose next contact is today or earlier.
  if (f.due === "1") parts.push(`(l.next_contact <= ${TODAY} AND l.status IN ('new','in_progress'))`);
  return { sql: parts.length ? `WHERE ${parts.join(" AND ")}` : "", params };
}

export async function listLeads(f: LeadFilter, page = 1): Promise<{ rows: Lead[]; total: number; pages: number }> {
  const db = await getDb();
  const { sql, params } = where(f);
  const wanted = Math.max(1, Math.floor(page) || 1);
  // One query returns the page and the total (window count). If the page is past the end the result is empty:
  // then the total is counted separately and the last page is shown instead.
  const fetchPage = (p: number) =>
    db.query<Lead & { total_count: string }>(
      `${SELECT.replace("SELECT ", "SELECT COUNT(*) OVER() AS total_count, ")} ${sql} ORDER BY l.created_at DESC, l.id DESC LIMIT ${PAGE_SIZE} OFFSET ${(p - 1) * PAGE_SIZE}`,
      params,
    );
  let rows = await fetchPage(wanted);
  let total = rows.length ? Number(rows[0].total_count) : 0;
  if (!rows.length && wanted > 1) {
    total = Number((await db.query<{ n: string }>(`SELECT COUNT(*) AS n FROM leads l ${sql}`, params))[0].n);
    rows = total ? await fetchPage(Math.ceil(total / PAGE_SIZE)) : [];
  }
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    rows: rows.map((r) => {
      const lead: Partial<typeof r> = { ...r };
      delete lead.total_count;
      return lead as Lead;
    }),
    total,
    pages,
  };
}

export async function allLeadsForExport(f: LeadFilter): Promise<Lead[]> {
  const db = await getDb();
  const { sql, params } = where(f);
  return db.query<Lead>(`${SELECT} ${sql} ORDER BY l.created_at DESC, l.id DESC LIMIT 10000`, params);
}

export async function getLead(id: number): Promise<{ lead: Lead; notes: Note[]; events: LeadEvent[] } | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = await getDb();
  const [rows, notes, events] = await Promise.all([
    db.query<Lead>(`${SELECT} WHERE l.id = $1`, [id]),
    db.query<Note>(
      `SELECT n.id, n.lead_id, n.user_id, n.text, n.created_at, u.name AS author
         FROM lead_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.lead_id = $1 ORDER BY n.created_at`,
      [id],
    ),
    db.query<LeadEvent>(
      `SELECT e.id, e.kind, e.from_value, e.to_value, e.created_at, u.name AS author
         FROM lead_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.lead_id = $1 ORDER BY e.created_at, e.id`,
      [id],
    ),
  ]);
  if (!rows[0]) return null;
  return { lead: rows[0], notes, events };
}

async function logEvent(leadId: number, userId: number | null, kind: LeadEvent["kind"], from: string, to: string) {
  const db = await getDb();
  await db.query("INSERT INTO lead_events (lead_id, user_id, kind, from_value, to_value) VALUES ($1,$2,$3,$4,$5)", [leadId, userId, kind, from, to]);
}

/** Changes the status and records who did it. Setting the same status again changes nothing. */
export async function setLeadStatus(id: number, status: LeadStatus, userId: number | null = null) {
  if (!STATUSES.includes(status)) throw new Error("Невірний статус.");
  const db = await getDb();
  const changed = await db.query<{ old: LeadStatus }>(
    `UPDATE leads l SET status = $2, updated_at = now()
       FROM (SELECT status FROM leads WHERE id = $1) o
      WHERE l.id = $1 AND o.status <> $2 RETURNING o.status AS old`,
    [id, status],
  );
  if (changed[0]) await logEvent(id, userId, "status", changed[0].old, status);
}

/** Who is handling the lead (null = nobody). The person must be an active user. */
export async function setLeadAssignee(id: number, assigneeId: number | null, userId: number) {
  const db = await getDb();
  if (assigneeId !== null) {
    const ok = await db.query("SELECT 1 FROM users WHERE id = $1 AND active", [assigneeId]);
    if (!ok[0]) throw new Error("Користувача не знайдено або доступ вимкнено.");
  }
  const changed = await db.query<{ old: number | null }>(
    `UPDATE leads l SET assignee_id = $2, updated_at = now()
       FROM (SELECT assignee_id FROM leads WHERE id = $1) o
      WHERE l.id = $1 AND o.assignee_id IS DISTINCT FROM $2::int RETURNING o.assignee_id AS old`,
    [id, assigneeId],
  );
  if (!changed[0]) return;
  const ids = [changed[0].old, assigneeId].filter((x): x is number => x !== null);
  const names = new Map((ids.length ? await db.query<{ id: number; name: string }>("SELECT id, name FROM users WHERE id = ANY($1::int[])", [ids]) : []).map((u) => [u.id, u.name]));
  await logEvent(id, userId, "assignee", changed[0].old === null ? "" : (names.get(changed[0].old) ?? "?"), assigneeId === null ? "" : (names.get(assigneeId) ?? "?"));
}

/** Date of the next planned contact (YYYY-MM-DD) or null to clear it. */
export async function setLeadFollowup(id: number, date: string | null, userId: number) {
  if (date !== null && !isRealDate(date)) throw new Error("Невірна дата.");
  const db = await getDb();
  const changed = await db.query<{ old: string | null }>(
    `UPDATE leads l SET next_contact = $2::date, updated_at = now()
       FROM (SELECT next_contact FROM leads WHERE id = $1) o
      WHERE l.id = $1 AND o.next_contact IS DISTINCT FROM $2::date RETURNING to_char(o.next_contact, 'YYYY-MM-DD') AS old`,
    [id, date],
  );
  if (changed[0]) await logEvent(id, userId, "followup", changed[0].old ?? "", date ?? "");
}

export type LeadResult = { dealValue: number | null; currency: Currency; lostReason: string };

/** Outcome details: the deal amount of a won lead, or the reason a lead was lost. */
export function validateResult(status: LeadStatus, r: { dealValue?: unknown; currency?: unknown; lostReason?: unknown }): LeadResult {
  const currency = (CURRENCIES as readonly string[]).includes(String(r.currency)) ? (r.currency as Currency) : "EUR";
  if (status === "won") {
    const raw = String(r.dealValue ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (raw === "") return { dealValue: null, currency, lostReason: "" };
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) throw new Error("Сума угоди: число від 0 до 1 000 000 000.");
    return { dealValue: Math.round(n * 100) / 100, currency, lostReason: "" };
  }
  if (status === "lost") {
    const reason = String(r.lostReason ?? "").trim();
    if (reason && !(LOST_REASONS as readonly string[]).includes(reason)) throw new Error("Оберіть причину зі списку.");
    return { dealValue: null, currency, lostReason: reason };
  }
  throw new Error("Результат можна вказати лише для заявки зі статусом «Угода» або «Відмова».");
}

export async function setLeadResult(id: number, r: LeadResult, userId: number) {
  const db = await getDb();
  const rows = await db.query<{ status: LeadStatus }>(
    "UPDATE leads SET deal_value = $2, deal_currency = $3, lost_reason = $4, updated_at = now() WHERE id = $1 AND status IN ('won','lost') RETURNING status",
    [id, r.dealValue, r.currency, r.lostReason],
  );
  if (!rows[0]) throw new Error("Спершу змініть статус на «Угода» або «Відмова».");
  await logEvent(id, userId, "result", "", rows[0].status === "won" ? (r.dealValue === null ? "" : `${r.dealValue} ${r.currency}`) : r.lostReason);
}

export async function addNote(leadId: number, userId: number, text: string) {
  const clean = text.trim().slice(0, 2000);
  if (!clean) throw new Error("Нотатка порожня.");
  const db = await getDb();
  await db.query("INSERT INTO lead_notes (lead_id, user_id, text) VALUES ($1,$2,$3)", [leadId, userId, clean]);
  await db.query("UPDATE leads SET updated_at = now() WHERE id = $1", [leadId]);
}

export async function deleteLead(id: number) {
  const db = await getDb();
  await db.query("DELETE FROM leads WHERE id = $1", [id]);
}

export type Stats = {
  byStatus: Record<LeadStatus, number>;
  last7: number;
  total: number;
  /** Open leads whose next contact is today or overdue. */
  due: number;
  deals: { currency: Currency; sum: number }[];
  lostReasons: { reason: string; n: number }[];
  perDay: { day: string; n: number }[];
};

/** All dashboard figures in ONE round trip (each extra query costs a network hop to the hosted database). */
export async function leadStats(): Promise<Stats> {
  const db = await getDb();
  const [r] = await db.query<{
    by_status: Partial<Record<LeadStatus, number>>; last7: number; total: number; due: number;
    deals: { currency: Currency; sum: number }[]; lost_reasons: { reason: string; n: number }[]; per_day: { day: string; n: number }[];
  }>(
    `SELECT
       (SELECT COALESCE(json_object_agg(status, n), '{}'::json) FROM (SELECT status, COUNT(*)::int AS n FROM leads GROUP BY status) s) AS by_status,
       (SELECT COUNT(*)::int FROM leads WHERE status <> 'spam' AND created_at > now() - interval '7 days') AS last7,
       (SELECT COUNT(*)::int FROM leads WHERE status <> 'spam') AS total,
       (SELECT COUNT(*)::int FROM leads WHERE next_contact <= ${TODAY} AND status IN ('new','in_progress')) AS due,
       (SELECT COALESCE(json_agg(json_build_object('currency', deal_currency, 'sum', s)), '[]'::json)
          FROM (SELECT deal_currency, SUM(deal_value)::float8 AS s FROM leads WHERE status = 'won' AND deal_value IS NOT NULL GROUP BY deal_currency) d) AS deals,
       (SELECT COALESCE(json_agg(json_build_object('reason', lost_reason, 'n', n) ORDER BY n DESC), '[]'::json)
          FROM (SELECT lost_reason, COUNT(*)::int AS n FROM leads WHERE status = 'lost' AND lost_reason <> '' GROUP BY lost_reason ORDER BY n DESC LIMIT 5) x) AS lost_reasons,
       (SELECT COALESCE(json_agg(json_build_object('day', day, 'n', n) ORDER BY day), '[]'::json)
          FROM (SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(l.id)::int AS n
                  FROM generate_series(current_date - 13, current_date, interval '1 day') d
                  LEFT JOIN leads l ON l.created_at::date = d::date AND l.status <> 'spam'
                 GROUP BY d) p) AS per_day`,
  );
  const byStatus = { new: 0, in_progress: 0, won: 0, lost: 0, spam: 0, ...r.by_status } as Record<LeadStatus, number>;
  return {
    byStatus, last7: Number(r.last7), total: Number(r.total), due: Number(r.due),
    deals: r.deals.map((d) => ({ currency: d.currency, sum: Number(d.sum) })),
    lostReasons: r.lost_reasons.map((x) => ({ reason: x.reason, n: Number(x.n) })),
    perDay: r.per_day.map((d) => ({ day: d.day, n: Number(d.n) })),
  };
}

/** Spreadsheet-safe CSV: quotes everything and neutralises formula injection (=, +, -, @). */
export function leadsToCsv(rows: Lead[]): string {
  const cell = (v: unknown) => {
    let s = v instanceof Date ? v.toISOString() : String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = ["id", "created_at", "status", "source", "name", "contact", "message", "model", "calc", "lang", "page", "assignee", "next_contact", "deal_value", "deal_currency", "lost_reason"];
  const lines = rows.map((r) =>
    [r.id, r.created_at, r.status, r.source, r.name, r.contact, r.message, r.model, r.calc, r.lang, r.page, r.assignee_name, r.next_contact, r.deal_value, r.deal_currency, r.lost_reason].map(cell).join(","),
  );
  return "﻿" + [head.join(","), ...lines].join("\r\n") + "\r\n";
}
