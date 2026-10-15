import Link from "next/link";
import { notFound } from "next/navigation";
import { addLeadNote, changeLeadStatus, removeLead } from "../../actions";
import ActionForm from "@/components/admin/ActionForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { requireUser } from "@/lib/admin-session";
import { formatDate, LANG_LABEL, SOURCE_LABEL, STATUS_LABEL } from "@/lib/admin-format";
import { getLead, STATUSES } from "@/lib/db/leads";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-[10rem_1fr]">
      <dt className="text-sm font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getLead(Number(id));
  if (!data) notFound();
  const { lead, notes } = data;
  const isEmail = /^[^\s@]+@[^\s@]+$/.test(lead.contact);
  const isPhone = /^\+?[0-9 ()\-]{6,}$/.test(lead.contact);

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="text-sm font-bold text-brand-green hover:underline">← До списку заявок</Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Заявка №{lead.id}</h1>
          <p className="text-muted">{formatDate(lead.created_at)}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <dl>
            <Row label="Ім'я">{lead.name}</Row>
            <Row label="Контакт">
              {isEmail ? <a className="font-bold text-brand-green hover:underline" href={`mailto:${lead.contact}`}>{lead.contact}</a>
                : isPhone ? <a className="font-bold text-brand-green hover:underline" href={`tel:${lead.contact.replace(/[^\d+]/g, "")}`}>{lead.contact}</a>
                : lead.contact}
            </Row>
            <Row label="Повідомлення">{lead.message ? <span className="whitespace-pre-wrap">{lead.message}</span> : "—"}</Row>
            <Row label="Модель">{lead.model || "—"}</Row>
            <Row label="Розрахунок">{lead.calc || "—"}</Row>
            <Row label="Джерело">{SOURCE_LABEL[lead.source] ?? lead.source}</Row>
            <Row label="Мова сайту">{LANG_LABEL[lead.lang] ?? (lead.lang || "—")}</Row>
            <Row label="Сторінка">{lead.page || "—"}</Row>
            <Row label="Лист менеджеру">{lead.mailed ? "надіслано" : "не надіслано (заявка збережена тут)"}</Row>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Статус</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <form key={s} action={changeLeadStatus}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    aria-pressed={lead.status === s}
                    className={`min-h-10 rounded-full border-2 px-4 text-sm font-bold transition-colors ${lead.status === s ? "border-brand-green bg-brand-green text-white" : "border-line hover:border-brand-green/60"}`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted">Нотатки</h2>
            <ul className="mt-4 space-y-3">
              {notes.length === 0 && <li className="text-sm text-muted">Нотаток ще немає.</li>}
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-soft p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.text}</p>
                  <p className="mt-1 text-xs text-muted">{n.author ?? "—"} · {formatDate(n.created_at)}</p>
                </li>
              ))}
            </ul>
            <ActionForm action={addLeadNote} submit="Додати нотатку" resetOnSuccess small className="mt-4">
              <input type="hidden" name="id" value={lead.id} />
              <label className="sr-only" htmlFor="note">Нотатка</label>
              <textarea id="note" name="text" rows={3} maxLength={2000} required placeholder="Наприклад: зателефонували, передзвонить завтра" className="field resize-none" />
            </ActionForm>
          </section>

          {user.role === "admin" && (
            <form action={removeLead}>
              <input type="hidden" name="id" value={lead.id} />
              <button className="text-sm font-bold text-red-700 hover:underline">Видалити заявку назавжди</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
