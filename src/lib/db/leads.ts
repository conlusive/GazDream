import "server-only";
import { getDb } from "./index";

export type LeadStatus = "new" | "in_progress" | "closed" | "spam";
export type LeadSource = "contact" | "quick" | "report";
export const STATUSES: LeadStatus[] = ["new", "in_progress", "closed", "spam"];
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
};
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

export type LeadFilter = { q?: string; status?: string; source?: string; lang?: string; from?: string; to?: string };
export const PAGE_SIZE = 25;

const isDate = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

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
    parts.push(`(name ILIKE ${n} OR contact ILIKE ${n} OR message ILIKE ${n} OR model ILIKE ${n} OR calc ILIKE ${n})`);
  }
  if (f.status && (STATUSES as string[]).includes(f.status)) add("status = ?", f.status);
  if (f.source && (SOURCES as string[]).includes(f.source)) add("source = ?", f.source);
  if (f.lang && /^[a-z]{2}$/.test(f.lang)) add("lang = ?", f.lang);
  if (isDate(f.from)) add("created_at >= ?::date", f.from);
  if (isDate(f.to)) add("created_at < (?::date + 1)", f.to);
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
      `SELECT *, COUNT(*) OVER() AS total_count FROM leads ${sql} ORDER BY created_at DESC, id DESC LIMIT ${PAGE_SIZE} OFFSET ${(p - 1) * PAGE_SIZE}`,
      params,
    );
  let rows = await fetchPage(wanted);
  let total = rows.length ? Number(rows[0].total_count) : 0;
  if (!rows.length && wanted > 1) {
    total = Number((await db.query<{ n: string }>(`SELECT COUNT(*) AS n FROM leads ${sql}`, params))[0].n);
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
  return db.query<Lead>(`SELECT * FROM leads ${sql} ORDER BY created_at DESC, id DESC LIMIT 10000`, params);
}

export async function getLead(id: number): Promise<{ lead: Lead; notes: Note[] } | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const db = await getDb();
  const rows = await db.query<Lead>("SELECT * FROM leads WHERE id = $1", [id]);
  if (!rows[0]) return null;
  const notes = await db.query<Note>(
    `SELECT n.id, n.lead_id, n.user_id, n.text, n.created_at, u.name AS author
       FROM lead_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.lead_id = $1 ORDER BY n.created_at`,
    [id],
  );
  return { lead: rows[0], notes };
}

export async function setLeadStatus(id: number, status: LeadStatus) {
  if (!STATUSES.includes(status)) throw new Error("Невірний статус.");
  const db = await getDb();
  await db.query("UPDATE leads SET status = $2, updated_at = now() WHERE id = $1", [id, status]);
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
  perDay: { day: string; n: number }[];
};

/** All dashboard figures in ONE round trip (each extra query costs a network hop to the hosted database). */
export async function leadStats(): Promise<Stats> {
  const db = await getDb();
  const [r] = await db.query<{ by_status: Partial<Record<LeadStatus, number>>; last7: number; total: number; per_day: { day: string; n: number }[] }>(
    `SELECT
       (SELECT COALESCE(json_object_agg(status, n), '{}'::json) FROM (SELECT status, COUNT(*)::int AS n FROM leads GROUP BY status) s) AS by_status,
       (SELECT COUNT(*)::int FROM leads WHERE status <> 'spam' AND created_at > now() - interval '7 days') AS last7,
       (SELECT COUNT(*)::int FROM leads WHERE status <> 'spam') AS total,
       (SELECT COALESCE(json_agg(json_build_object('day', day, 'n', n) ORDER BY day), '[]'::json)
          FROM (SELECT to_char(d, 'YYYY-MM-DD') AS day, COUNT(l.id)::int AS n
                  FROM generate_series(current_date - 13, current_date, interval '1 day') d
                  LEFT JOIN leads l ON l.created_at::date = d::date AND l.status <> 'spam'
                 GROUP BY d) p) AS per_day`,
  );
  const byStatus = { new: 0, in_progress: 0, closed: 0, spam: 0, ...r.by_status } as Record<LeadStatus, number>;
  return { byStatus, last7: Number(r.last7), total: Number(r.total), perDay: r.per_day.map((d) => ({ day: d.day, n: Number(d.n) })) };
}

/** Spreadsheet-safe CSV: quotes everything and neutralises formula injection (=, +, -, @). */
export function leadsToCsv(rows: Lead[]): string {
  const cell = (v: unknown) => {
    let s = v instanceof Date ? v.toISOString() : String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = ["id", "created_at", "status", "source", "name", "contact", "message", "model", "calc", "lang", "page"];
  const lines = rows.map((r) => [r.id, r.created_at, r.status, r.source, r.name, r.contact, r.message, r.model, r.calc, r.lang, r.page].map(cell).join(","));
  return "﻿" + [head.join(","), ...lines].join("\r\n") + "\r\n";
}
