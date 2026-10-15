import { currentUser } from "@/lib/admin-session";
import { audit } from "@/lib/db/audit";
import { allLeadsForExport, leadsToCsv } from "@/lib/db/leads";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const q = new URL(request.url).searchParams;
  const rows = await allLeadsForExport({
    q: q.get("q") ?? "",
    status: q.get("status") ?? "",
    source: q.get("source") ?? "",
    lang: q.get("lang") ?? "",
    from: q.get("from") ?? "",
    to: q.get("to") ?? "",
  });
  await audit(user, "Експорт заявок у CSV", `${rows.length} шт.`);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(leadsToCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="zayavky-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
