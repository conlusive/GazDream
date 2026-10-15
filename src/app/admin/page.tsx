import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { PageHeader, Section } from "@/components/admin/ui";
import { requireUser } from "@/lib/admin-session";
import { formatDate, formatDay } from "@/lib/admin-format";
import { leadStats, listLeads } from "@/lib/db/leads";

function Stat({ title, value, hint, href }: { title: string; value: number; hint: string; href?: string }) {
  const body = (
    <div className="card h-full p-3 transition-colors hover:border-brand-green/50 sm:p-5">
      <p className="text-xs font-semibold text-muted sm:text-sm">{title}</p>
      <p className="tabular mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{value}</p>
      <p className="mt-1 hidden text-xs text-muted sm:block">{hint}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function Dashboard() {
  const user = await requireUser();
  const [stats, latest] = await Promise.all([leadStats(), listLeads({ status: "new" }, 1)]);
  const max = Math.max(1, ...stats.perDay.map((d) => d.n));

  return (
    <div className="space-y-6">
      <PageHeader title={`Вітаємо, ${user.name}`} subtitle="Що зараз із заявками з сайту." />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat title="Нові заявки" value={stats.byStatus.new} hint="чекають на відповідь" href="/admin/leads?status=new" />
        <Stat title="В роботі" value={stats.byStatus.in_progress} hint="вже обробляються" href="/admin/leads?status=in_progress" />
        <Stat title="За 7 днів" value={stats.last7} hint={`усього заявок: ${stats.total}`} href="/admin/leads" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Section title="Нові заявки" hint={latest.total > 6 ? `Показано 6 із ${latest.total}.` : undefined}>
          <ul className="-my-2 divide-y divide-line">
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
          <Link href="/admin/leads" className="mt-4 inline-block text-sm font-bold text-brand-green hover:underline">Усі заявки →</Link>
        </Section>

        <Section title="Останні 14 днів">
          <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Кількість заявок по днях">
            {stats.perDay.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${formatDay(d.day)}: ${d.n}`}>
                <span className="tabular text-[10px] font-bold text-muted">{d.n || ""}</span>
                <div className="w-full rounded-t bg-brand-green" style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n ? 4 : 2, opacity: d.n ? 1 : 0.25 }} />
                <span className="text-[10px] text-muted">{formatDay(d.day).slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
