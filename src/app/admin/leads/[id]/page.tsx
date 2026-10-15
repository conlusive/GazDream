import Link from "next/link";
import { notFound } from "next/navigation";
import { addLeadNote, changeLeadStatus, removeLead, saveLeadHandlingAction, saveLeadResultAction } from "../../actions";
import ActionForm from "@/components/admin/ActionForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { PageHeader, Section } from "@/components/admin/ui";
import { requireUser } from "@/lib/admin-session";
import { eventText, formatDate, formatDateOnly, LANG_LABEL, SOURCE_LABEL, STATUS_LABEL, todayLocal } from "@/lib/admin-format";
import { CURRENCIES, getLead, LOST_REASONS, STATUSES } from "@/lib/db/leads";
import { listUsers } from "@/lib/db/users";

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
  const [data, users] = await Promise.all([getLead(Number(id)), listUsers()]);
  if (!data) notFound();
  const { lead, notes, events } = data;
  const open = lead.status === "new" || lead.status === "in_progress";
  const overdue = open && lead.next_contact !== null && lead.next_contact <= todayLocal();
  const isEmail = /^[^\s@]+@[^\s@]+$/.test(lead.contact);
  const isPhone = /^\+?[0-9 ()\-]{6,}$/.test(lead.contact);

  return (
    <div className="space-y-6">
      <Link href="/admin/leads" className="text-sm font-bold text-brand-green hover:underline">← До списку заявок</Link>

      <PageHeader title={`Заявка №${lead.id}`} subtitle={formatDate(lead.created_at)} action={<StatusBadge status={lead.status} />} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section>
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
        </Section>

        <div className="space-y-6">
          <Section title="Статус">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <form key={s} action={changeLeadStatus}>
                  <input type="hidden" name="id" value={lead.id} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    aria-pressed={lead.status === s}
                    className={`min-h-10 rounded-full border-2 px-4 text-sm font-bold transition-colors ${lead.status === s ? "border-ink bg-ink text-white" : "border-line hover:border-brand-green/60"}`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                </form>
              ))}
            </div>
          </Section>

          {(lead.status === "won" || lead.status === "lost") && (
            <Section title={lead.status === "won" ? "Результат: угода" : "Результат: відмова"}>
              <ActionForm action={saveLeadResultAction} submit="Зберегти результат" small className="space-y-3">
                <input type="hidden" name="id" value={lead.id} />
                {lead.status === "won" ? (
                  <div className="grid grid-cols-[1fr_6rem] gap-2">
                    <div>
                      <label htmlFor="deal" className="mb-1 block text-sm font-bold">Сума угоди</label>
                      <input id="deal" name="deal_value" inputMode="decimal" defaultValue={lead.deal_value ?? ""} placeholder="наприклад 120000" className="field" />
                    </div>
                    <div>
                      <label htmlFor="cur" className="mb-1 block text-sm font-bold">Валюта</label>
                      <select id="cur" name="currency" defaultValue={lead.deal_currency} className="field select">
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="reason" className="mb-1 block text-sm font-bold">Причина відмови</label>
                    <select id="reason" name="lost_reason" defaultValue={lead.lost_reason} className="field select">
                      <option value="">Не вказано</option>
                      {LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </ActionForm>
            </Section>
          )}

          <Section title="Ведення">
            <ActionForm action={saveLeadHandlingAction} submit="Зберегти" small className="space-y-3">
              <input type="hidden" name="id" value={lead.id} />
              <div>
                <label htmlFor="assignee" className="mb-1 block text-sm font-bold">Відповідальний</label>
                <select id="assignee" name="assignee" defaultValue={lead.assignee_id ?? ""} className="field select">
                  <option value="">Не призначено</option>
                  {users.filter((u) => u.active || u.id === lead.assignee_id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="next" className="mb-1 block text-sm font-bold">Наступний контакт</label>
                <input id="next" name="next_contact" type="date" defaultValue={lead.next_contact ?? ""} className="field" />
                {overdue && <p className="mt-1 text-xs font-bold text-red-700">Строк настав: {formatDateOnly(lead.next_contact!)}. Зв&apos;яжіться з клієнтом або перенесіть дату.</p>}
              </div>
            </ActionForm>
          </Section>

          <Section title="Нотатки">
            <ul className="space-y-3">
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
          </Section>

          <Section title="Історія">
            <ol className="space-y-2 text-sm">
              <li className="flex justify-between gap-3 border-b border-line pb-2 text-muted">
                <span>Заявка отримана ({SOURCE_LABEL[lead.source] ?? lead.source})</span>
                <span className="shrink-0 text-xs">{formatDate(lead.created_at)}</span>
              </li>
              {events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                  <span>{eventText(e)}</span>
                  <span className="shrink-0 text-right text-xs text-muted">{e.author ?? "—"}<br />{formatDate(e.created_at)}</span>
                </li>
              ))}
            </ol>
          </Section>

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
