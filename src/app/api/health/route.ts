import { NextResponse } from "next/server";
import { getDb, storageIsDurable } from "@/lib/db";

// For uptime monitors and the Docker health check. Reveals nothing beyond up/down.
export async function GET() {
  try {
    const db = await getDb();
    await db.query("SELECT 1");
    return NextResponse.json({ ok: true, db: storageIsDurable() ? "postgres" : "embedded" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
