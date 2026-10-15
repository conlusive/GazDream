import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { requireUser } from "@/lib/admin-session";
import { formatDate, LANG_LABEL, SOURCE_LABEL, STATUS_LABEL } from "@/lib/admin-format";
import { listLeads, SOURCES, STATUSES, type LeadFilter } from "@/lib/db/leads";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  const filter: LeadFilter = { q: one(sp.q), status: one(sp.status), source: one(sp.source), lang: one(sp.lang), from: one(sp.from), to: one(sp.to) };
  const page = Number(one(sp.page)) || 1;
  const { rows, total, pages } = await listLeads(filter, page);

  const query = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filter, ...extra })) if (v !== undefined && String(v) !== "") p.set(k, String(v));
    return p.toString();
  };
  const current = Math.min(Math.max(1, page), pages);
  const select = "field !py-2 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Заявки</h1>
          <p className="text-muted">Знайдено: <strong className="tabular">{total}</strong></p>
        </div>
        <a href={`/admin/leads/export?${query({})}`} className="btn btn-outline !px-4 !py-2">Завантажити CSV</a>
      </div>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <input name="q" defaultValue={filter.q} placeholder="Пошук: ім'я, контакт, текст…" aria-label="Пошук" className="field !py-2 text-sm lg:col-span-2" />
        <select name="status" defaultValue={filter.status} aria-label="Статус" className={select}>
          <option value="">Усі статуси</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select name="source" defaultValue={filter.source} aria-label="Джерело" className={select}>
          <option value="">Усі джерела</option>
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
        </select>
        <select name="lang" defaultValue={filter.lang} aria-label="Мова" className={select}>
          <option value="">Усі мови</option>
          {Object.entries(LANG_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" name="from" defaultValue={filter.from} aria-label="Від дати" className={select} />
          <input type="date" name="to" defaultValue={filter.to} aria-label="До дати" className={select} />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button className="btn btn-primary !px-5 !py-2">Застосувати</button>
          <Link href="/admin/leads" className="btn btn-outline !px-5 !py-2">Скинути</Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="p-4 font-semibold">Дата</th>
              <th className="p-4 font-semibold">Клієнт</th>
              <th className="p-4 font-semibold">Запит</th>
              <th className="p-4 font-semibold">Джерело</th>
              <th className="p-4 font-semibold">Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted">Заявок за цими умовами немає.</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-soft">
                <td className="tabular whitespace-nowrap p-4 text-muted">{formatDate(l.created_at)}</td>
                <td className="p-4">
                  <Link href={`/admin/leads/${l.id}`} className="font-bold text-brand-green hover:underline">{l.name}</Link>
                  <span className="block text-xs text-muted">{l.contact}</span>
                </td>
                <td className="max-w-xs p-4">
                  <span className="line-clamp-2">{l.message || l.calc || "—"}</span>
                  {l.model && <span className="mt-1 inline-block rounded bg-soft px-2 py-0.5 text-xs font-bold">{l.model}</span>}
                </td>
                <td className="p-4 text-muted">
                  {SOURCE_LABEL[l.source] ?? l.source}
                  <span className="block text-xs">{LANG_LABEL[l.lang] ?? (l.lang || "—")}</span>
                </td>
                <td className="p-4"><StatusBadge status={l.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
