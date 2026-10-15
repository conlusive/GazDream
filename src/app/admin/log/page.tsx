import { requireAdmin } from "@/lib/admin-session";
import { formatDate } from "@/lib/admin-format";
import { listAudit } from "@/lib/db/audit";

export default async function LogPage() {
  await requireAdmin();
  const rows = await listAudit(200);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Журнал дій</h1>
        <p className="text-muted">Хто й що змінював (останні 200 записів).</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3 font-semibold">Коли</th><th className="p-3 font-semibold">Хто</th><th className="p-3 font-semibold">Дія</th><th className="p-3 font-semibold">Деталі</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-muted">Записів ще немає.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line align-top last:border-0">
                <td className="tabular whitespace-nowrap p-3 text-muted">{formatDate(r.created_at)}</td>
                <td className="p-3">{r.user_email || "—"}</td>
                <td className="p-3 font-semibold">{r.action}</td>
                <td className="max-w-md break-words p-3 text-muted">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
