import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/admin-session";
import { formatDate, LANG_LABEL, SOURCE_LABEL } from "@/lib/admin-format";
import { leadStats, listLeads, SOURCES, STATUSES, type LeadFilter } from "@/lib/db/leads";

const TAB_LABEL = { new: "Нові", in_progress: "В роботі", closed: "Закриті", spam: "Спам" } as const;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  const filter: LeadFilter = { q: one(sp.q), status: one(sp.status), source: one(sp.source), lang: one(sp.lang), from: one(sp.from), to: one(sp.to) };
  const page = Number(one(sp.page)) || 1;
  const [{ rows, total, pages }, stats] = await Promise.all([listLeads(filter, page), leadStats()]);

  const query = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filter, ...extra })) if (v !== undefined && String(v) !== "") p.set(k, String(v));
    return p.toString();
  };
  const current = Math.min(Math.max(1, page), pages);
  const moreActive = Boolean(filter.source || filter.lang || filter.from || filter.to);
  const anyFilter = moreActive || Boolean(filter.q || filter.status);
  const tabs: { value: string; label: string; count: number }[] = [
    { value: "", label: "Усі", count: stats.total },
    ...STATUSES.map((s) => ({ value: s, label: TAB_LABEL[s], count: stats.byStatus[s] })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Заявки"
        subtitle={<>Знайдено: <strong className="tabular">{total}</strong></>}
        action={<a href={`/admin/leads/export?${query({})}`} className="btn btn-outline !px-4 !py-2">Завантажити CSV</a>}
      />

      <nav aria-label="Статус заявок" className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = filter.status === t.value;
          return (
            <Link
              key={t.value || "all"}
              href={`/admin/leads?${query({ status: t.value, page: 1 })}`}
              aria-current={active ? "page" : undefined}
              className={`min-h-10 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${active ? "border-forest bg-forest text-white" : "border-line hover:border-brand-green/60"}`}
            >
              {t.label} <span className={`tabular ${active ? "text-white/70" : "text-muted"}`}>{t.count}</span>
            </Link>
          );
        })}
      </nav>

      <form className="card p-4" role="search">
        <input type="hidden" name="status" value={filter.status} />
        <div className="flex flex-wrap gap-2">
          <input name="q" defaultValue={filter.q} placeholder="Пошук: ім'я, контакт, текст…" aria-label="Пошук" className="field min-w-[14rem] flex-1 !py-2 text-sm" />
          <button className="btn btn-primary !px-5 !py-2">Шукати</button>
          {anyFilter && <Link href="/admin/leads" className="btn btn-outline !px-5 !py-2">Скинути</Link>}
        </div>
        <details className="mt-3" open={moreActive}>
          <summary className="cursor-pointer text-sm font-bold text-brand-green">Додаткові фільтри</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select name="source" defaultValue={filter.source} aria-label="Джерело" className="field select !py-2 text-sm">
              <option value="">Усі джерела</option>
              {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </select>
            <select name="lang" defaultValue={filter.lang} aria-label="Мова" className="field select !py-2 text-sm">
              <option value="">Усі мови</option>
              {Object.entries(LANG_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="date" name="from" defaultValue={filter.from} aria-label="Від дати" className="field !py-2 text-sm" />
            <input type="date" name="to" defaultValue={filter.to} aria-label="До дати" className="field !py-2 text-sm" />
          </div>
        </details>
      </form>

      <ul className="card divide-y divide-line">
        {rows.length === 0 && <li className="p-8 text-center text-muted">Заявок за цими умовами немає.</li>}
        {rows.map((l) => (
          <li key={l.id} className="relative grid gap-2 p-4 transition-colors hover:bg-soft md:grid-cols-[13rem_1fr_11.5rem_6rem] md:items-center md:gap-5">
            <div className="min-w-0">
              <Link href={`/admin/leads/${l.id}`} className="block truncate font-bold text-brand-green after:absolute after:inset-0 hover:underline">{l.name}</Link>
              <span className="block truncate text-xs text-muted">{l.contact}</span>
            </div>
            <div className="min-w-0 text-sm">
              <span className="line-clamp-2">{l.message || l.calc || "—"}</span>
              {l.model && <span className="mt-1 inline-block rounded bg-tint px-2 py-0.5 text-xs font-bold">{l.model}</span>}
            </div>
            <p className="tabular text-xs text-muted">
              {formatDate(l.created_at)}
              <span className="block">{SOURCE_LABEL[l.source] ?? l.source}</span>
              <span className="block">{LANG_LABEL[l.lang] ?? (l.lang || "—")}</span>
            </p>
            <div className="md:text-right"><StatusBadge status={l.status} /></div>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <nav aria-label="Сторінки" className="flex items-center justify-between text-sm">
          {current > 1 ? <Link className="font-bold text-brand-green hover:underline" href={`/admin/leads?${query({ page: current - 1 })}`}>← Новіші</Link> : <span />}
          <span className="tabular text-muted">Сторінка {current} з {pages}</span>
          {current < pages ? <Link className="font-bold text-brand-green hover:underline" href={`/admin/leads?${query({ page: current + 1 })}`}>Старіші →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
