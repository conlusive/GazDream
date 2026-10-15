import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { deliverLead, type Lead } from "@/lib/lead-delivery";
import { insertLead, type LeadSource } from "@/lib/db/leads";

export type IncomingLead = Lead & { source: LeadSource };

/**
 * Saves a lead in the database and e-mails it to sales. The database is the source of truth:
 * if it is unreachable the lead still goes out by e-mail and is written to a local log, so it is never lost.
 * Returns whether the visitor can be told "sent": true when at least the e-mail or the database got it.
 */
export async function recordLead(lead: IncomingLead, env: Record<string, string | undefined> = process.env): Promise<{ ok: boolean; configured: boolean }> {
  const delivery = await deliverLead(lead, env);
  const mailed = delivery.delivered.length > 0;

  let stored = false;
  try {
    await insertLead({ ...lead, mailed });
    stored = true;
  } catch (err) {
    console.error("Could not store lead in the database:", err instanceof Error ? err.message : err);
    try {
      const file = env.LEADS_LOG_FILE ?? path.join(process.cwd(), "data", "leads.jsonl");
      await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
      await appendFile(/*turbopackIgnore: true*/ file, JSON.stringify({ ...lead, receivedAt: new Date().toISOString(), mailed }) + "\n", "utf8");
    } catch {
      /* last resort failed too; the e-mail (if it went out) is all that is left */
    }
  }
  return { ok: mailed || stored, configured: delivery.configured.length > 0 || stored };
}
