import { removeProject, saveProjectAction } from "../actions";
import ActionForm from "@/components/admin/ActionForm";
import { PageHeader, Section } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-session";
import { listAllProjects, type Project } from "@/lib/db/projects";

function ProjectFields({ p }: { p?: Project }) {
  const k = p?.id ?? "new";
  const label = "mb-1 block text-sm font-bold";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="sm:col-span-2">
        <p className="mb-2 text-sm font-bold">Місце розташування (клієнтів не називаємо)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor={`lpl-${k}`}>Польська (обов&apos;язково)</label><input id={`lpl-${k}`} name="location_pl" required maxLength={80} defaultValue={p?.location_pl} placeholder="Obwód sumski, Ukraina" className="field" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor={`len-${k}`}>Англійська</label><input id={`len-${k}`} name="location_en" maxLength={80} defaultValue={p?.location_en} placeholder="Sumy region, Ukraine" className="field" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor={`lde-${k}`}>Німецька</label><input id={`lde-${k}`} name="location_de" maxLength={80} defaultValue={p?.location_de} placeholder="Region Sumy, Ukraine" className="field" /></div>
          <div><label className="mb-1 block text-xs font-semibold text-muted" htmlFor={`luk-${k}`}>Українська</label><input id={`luk-${k}`} name="location_uk" maxLength={80} defaultValue={p?.location_uk} placeholder="Сумська область, Україна" className="field" /></div>
        </div>
        <p className="mt-1 text-xs text-muted">Порожня мова показується польським текстом.</p>
      </div>
      <div><label className={label} htmlFor={`pw-${k}`}>Потужність, МВт</label><input id={`pw-${k}`} name="power_mw" required inputMode="decimal" defaultValue={p?.power_mw} placeholder="5,0" className="field" /></div>
      <div>
        <label className={label} htmlFor={`fu-${k}`}>Паливо</label>
        <select id={`fu-${k}`} name="fuel" defaultValue={p?.fuel ?? "chips"} className="field select">
          <option value="chips">Щепа</option>
          <option value="moist">Волога щепа</option>
        </select>
      </div>
      <div><label className={label} htmlFor={`dr-${k}`}>Сушарня (необов&apos;язково)</label><input id={`dr-${k}`} name="dryer" maxLength={40} defaultValue={p?.dryer} placeholder="Comil" className="field" /></div>
      <div><label className={label} htmlFor={`pd-${k}`}>Продуктивність, т/добу (необов&apos;язково)</label><input id={`pd-${k}`} name="per_day" maxLength={20} defaultValue={p?.per_day} placeholder="350–400" className="field" /></div>
      <div><label className={label} htmlFor={`so-${k}`}>Порядок (менше = вище)</label><input id={`so-${k}`} name="sort" type="number" defaultValue={p?.sort ?? 0} className="field" /></div>
      <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
        <input type="checkbox" name="visible" defaultChecked={p?.visible ?? true} className="h-4 w-4 accent-brand-green" /> Показувати на сайті
      </label>
    </div>
  );
}

export default async function ProjectsAdminPage() {
  await requireAdmin();
  const projects = await listAllProjects();

  return (
    <div className="space-y-6">
      <PageHeader title="Проєкти" subtitle="Установки, що показуються на сторінці «Реалізації». Зміни одразу з'являються на сайті всіма мовами, а підсумкові цифри (кількість, діапазон потужності) рахуються самі." />

      <Section title={`Список (${projects.length})`}>
        <div className="space-y-3">
          {projects.length === 0 && <p className="text-sm text-muted">Проєктів немає: блок на сайті не показується.</p>}
          {projects.map((p) => (
            <details key={p.id} className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer list-none">
                <span className="font-bold">{p.location_pl}</span>
                <span className="text-muted"> · {p.power_mw} МВт · {p.fuel === "moist" ? "волога щепа" : "щепа"}{p.dryer ? ` · ${p.dryer}` : ""}{p.per_day ? ` · ${p.per_day} т/добу` : ""}</span>
                {!p.visible && <span className="ml-2 rounded bg-line px-2 py-0.5 text-xs font-bold text-muted">приховано</span>}
              </summary>
              <div className="mt-4 border-t border-line pt-4">
                <ActionForm action={saveProjectAction} submit="Зберегти" small>
                  <ProjectFields p={p} />
                </ActionForm>
                <form action={removeProject} className="mt-3">
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-sm font-bold text-red-700 hover:underline">Видалити проєкт</button>
                </form>
              </div>
            </details>
          ))}
          <details className="rounded-xl border border-dashed border-brand-green/50 p-4" open={projects.length === 0}>
            <summary className="cursor-pointer font-bold text-brand-green">+ Додати проєкт</summary>
            <div className="mt-4">
              <ActionForm action={saveProjectAction} submit="Додати проєкт" resetOnSuccess>
                <ProjectFields />
              </ActionForm>
            </div>
          </details>
        </div>
      </Section>
    </div>
  );
}
