import "server-only";
import { getDb } from "./index";
import type { User } from "./users";

export type AuditEntry = { id: number; created_at: Date | string; user_email: string; action: string; details: string };

/** Records who changed what. Never throws: an audit failure must not break the action itself. */
export async function audit(user: Pick<User, "id" | "email"> | null, action: string, details = "") {
  try {
    const db = await getDb();
    await db.query("INSERT INTO audit_log (user_id, user_email, action, details) VALUES ($1,$2,$3,$4)", [user?.id ?? null, user?.email ?? "", action, details.slice(0, 1000)]);
  } catch (err) {
    console.error("audit failed", err instanceof Error ? err.message : err);
  }
}

export async function listAudit(limit = 200): Promise<AuditEntry[]> {
  const db = await getDb();
  return db.query<AuditEntry>("SELECT id, created_at, user_email, action, details FROM audit_log ORDER BY created_at DESC, id DESC LIMIT $1", [limit]);
}
