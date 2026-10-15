import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { requireUser } from "@/lib/admin-session";
import { formatDate, formatDay, LANG_LABEL, SOURCE_LABEL } from "@/lib/admin-format";
import { leadStats, listLeads } from "@/lib/db/leads";

function Card({ title, value, hint, href }: { title: string; value: number; hint?: string; href?: string }) {
  const body = (
    <div className="card p-5 transition-colors hover:border-brand-green/50">
      <p className="text-sm font-semibold text-muted">{title}</p>
      <p className="tabular mt-1 text-4xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function Dashboard() {
  const user = await requireUser();
  const [stats, latest] = await Promise.all([leadStats(), listLeads({ status: "new" }, 1)]);
  const max = Math.max(1, ...stats.perDay.map((d) => d.n));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Вітаємо, {user.name}</h1>
        <p className="text-muted">Короткий огляд заявок із сайту.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Нові заявки" value={stats.byStatus.new} hint="потребують відповіді" href="/admin/leads?status=new" />
        <Card title="В роботі" value={stats.byStatus.in_progress} href="/admin/leads?status=in_progress" />
        <Card title="За 7 днів" value={stats.last7} hint="без спаму" />
        <Card title="За 30 днів" value={stats.last30} hint={`усього: ${stats.total}`} />
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Заявки за останні 14 днів</h2>
        <div className="mt-5 flex h-36 items-end gap-1.5" role="img" aria-label="Стовпчики кількості заявок по днях">
          {stats.perDay.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${formatDay(d.day)}: ${d.n}`}>
              <span className="tabular text-[10px] font-bold text-muted">{d.n || ""}</span>
              <div className="w-full rounded-t bg-brand-green" style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n ? 4 : 2, opacity: d.n ? 1 : 0.25 }} />
              <span className="text-[10px] text-muted">{formatDay(d.day).slice(0, 2)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Звідки заявки</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {stats.bySource.length === 0 && <li className="text-muted">Заявок ще немає.</li>}
            {stats.bySource.map((s) => (
              <li key={s.source} className="flex justify-between border-b border-line pb-2"><span>{SOURCE_LABEL[s.source] ?? s.source}</span><strong className="tabular">{s.n}</strong></li>
            ))}
          </ul>
          <h2 className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-muted">Мова сайту</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {stats.byLang.map((s) => (
              <li key={s.lang} className="flex justify-between border-b border-line pb-2"><span>{LANG_LABEL[s.lang] ?? s.lang}</span><strong className="tabular">{s.n}</strong></li>
            ))}
          </ul>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Останні нові заявки</h2>
            <Link href="/admin/leads" className="text-sm font-bold text-brand-green hover:underline">Усі заявки →</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {latest.rows.length === 0 && <li className="py-3 text-sm text-muted">Нових заявок немає.</li>}
            {latest.rows.slice(0, 6).map((l) => (
              <li key={l.id}>
                <Link href={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand-green">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{l.name}</span>
                    <span className="block truncate text-xs text-muted">{l.contact} · {formatDate(l.created_at)}</span>
                  </span>
                  <StatusBadge status={l.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
