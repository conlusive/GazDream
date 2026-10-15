import { removeTestimonial, saveContactsAction, saveTestimonialAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/admin-session";
import { LANG_LABEL } from "@/lib/admin-format";
import { readSettings } from "@/lib/db/settings";
import { listAllTestimonials, TESTIMONIAL_LANGS, type Testimonial } from "@/lib/db/testimonials";

function TestimonialFields({ t }: { t?: Testimonial }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {t && <input type="hidden" name="id" value={t.id} />}
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-bold" htmlFor={`q-${t?.id ?? "new"}`}>Текст відгуку</label>
        <textarea id={`q-${t?.id ?? "new"}`} name="quote" rows={3} required minLength={10} maxLength={600} defaultValue={t?.quote} className="field resize-none" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor={`a-${t?.id ?? "new"}`}>Автор</label>
        <input id={`a-${t?.id ?? "new"}`} name="author" required maxLength={80} defaultValue={t?.author} className="field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor={`r-${t?.id ?? "new"}`}>Посада / господарство</label>
        <input id={`r-${t?.id ?? "new"}`} name="role" maxLength={80} defaultValue={t?.role} className="field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor={`l-${t?.id ?? "new"}`}>Регіон</label>
        <input id={`l-${t?.id ?? "new"}`} name="location" maxLength={80} defaultValue={t?.location} className="field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor={`g-${t?.id ?? "new"}`}>Мова відгуку</label>
        <select id={`g-${t?.id ?? "new"}`} name="lang" defaultValue={t?.lang ?? "all"} className="field">
          {TESTIMONIAL_LANGS.map((l) => <option key={l} value={l}>{l === "all" ? "Усі мови" : LANG_LABEL[l]}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor={`s-${t?.id ?? "new"}`}>Порядок (менше = вище)</label>
        <input id={`s-${t?.id ?? "new"}`} name="sort" type="number" defaultValue={t?.sort ?? 0} className="field" />
      </div>
      <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
        <input type="checkbox" name="visible" defaultChecked={t?.visible ?? true} className="h-4 w-4 accent-brand-green" /> Показувати на сайті
      </label>
    </div>
  );
}

export default async function ContentPage() {
  await requireAdmin();
  const [settings, testimonials] = await Promise.all([readSettings(), listAllTestimonials()]);
  const c = settings.contacts;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Контакти й відгуки</h1>
        <p className="text-muted">Зміни одразу з&apos;являються на сайті всіма мовами.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Контакти компанії</h2>
        <ActionForm action={saveContactsAction} submit="Зберегти контакти" className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div><label className="mb-1 block text-sm font-bold" htmlFor="phone">Телефон відділу продажу</label><input id="phone" name="phone" required defaultValue={c.phone} className="field" /></div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="email">E-mail відділу продажу</label><input id="email" name="email" type="email" required defaultValue={c.email} className="field" /></div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="officePhone">Телефон секретаріату</label><input id="officePhone" name="officePhone" required defaultValue={c.officePhone} className="field" /></div>
          <div><label className="mb-1 block text-sm font-bold" htmlFor="officeEmail">E-mail секретаріату</label><input id="officeEmail" name="officeEmail" type="email" required defaultValue={c.officeEmail} className="field" /></div>
        </ActionForm>
        <p className="mt-2 text-xs text-muted">Адреса, на яку надходять заявки, задається окремо на сервері (змінна <code>LEADS_EMAIL_TO</code>).</p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">Відгуки клієнтів</h2>
        <p className="mb-4 text-sm text-muted">Додавайте лише справжні відгуки з дозволом клієнта. Поки немає жодного видимого відгуку, блок на сайті не показується.</p>
        <div className="space-y-4">
          {testimonials.map((t) => (
            <details key={t.id} className="card p-5">
              <summary className="cursor-pointer list-none font-bold">
                {t.author} <span className="font-normal text-muted">· {t.lang === "all" ? "усі мови" : LANG_LABEL[t.lang]} · {t.visible ? "показується" : "приховано"}</span>
                <span className="mt-1 block text-sm font-normal text-muted line-clamp-1">{t.quote}</span>
              </summary>
              <div className="mt-4 border-t border-line pt-4">
                <ActionForm action={saveTestimonialAction} submit="Зберегти" small>
                  <TestimonialFields t={t} />
                </ActionForm>
                <form action={removeTestimonial} className="mt-3">
                  <input type="hidden" name="id" value={t.id} />
                  <button className="text-sm font-bold text-red-700 hover:underline">Видалити відгук</button>
                </form>
              </div>
            </details>
          ))}
          <div className="card p-5 sm:p-6">
            <h3 className="mb-3 font-extrabold">Додати відгук</h3>
            <ActionForm action={saveTestimonialAction} submit="Додати відгук" resetOnSuccess>
              <TestimonialFields />
            </ActionForm>
          </div>
        </div>
      </section>
    </div>
  );
}
