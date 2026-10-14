import { notFound } from "next/navigation";
import Anatomy from "@/components/Anatomy";
import ModelPicker from "@/components/ModelPicker";
import PageHero from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { hasLocale } from "@/i18n/config";
import { MODELS } from "@/lib/content";
import { rich } from "@/lib/rich";
import { getDictionary } from "../dictionaries";

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export default async function BoilersPage({ params }: PageProps<"/[lang]/boilers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const { boilers: b, hero, spec } = dict;

  const rows = [
    { label: spec.power, value: (m: (typeof MODELS)[number]) => m.powerKw },
    { label: spec.type, value: (m: (typeof MODELS)[number]) => b.types[m.type] },
    { label: spec.burner, value: (m: (typeof MODELS)[number]) => String(m.burnerKw) },
    { label: spec.chimney, value: () => spec.chimneyVal },
    { label: spec.fuel, value: () => spec.fuelVal },
  ];

  return (
    <>
      <PageHero eyebrow={hero.badge} title={b.title} lead={b.lead} image="/photos/install-hopper.jpg" />

      <section className="section">
        <div className="container-x">
          <ModelPicker lang={lang} boilers={b} selector={dict.selector} />
        </div>
      </section>

      <section className="bg-soft section">
        <div className="container-x">
          <h2 className="display reveal text-3xl sm:text-4xl">{rich(spec.title.replace(/(\S+)$/, "*$1*"))}</h2>
          <div className="reveal mt-8 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="tabular w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="p-4 font-semibold text-muted" />
                  {MODELS.map((m) => (
                    <th key={m.name} className="p-4 text-lg font-extrabold text-brand-green">{m.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-line last:border-0">
                    <th scope="row" className="p-4 font-semibold text-muted">{r.label}</th>
                    {MODELS.map((m) => (
                      <td key={m.name} className="p-4 font-bold">{r.value(m)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x reveal">
          <Anatomy eyebrow={dict.anatomy.eyebrow} title={dict.anatomy.title} hint={dict.anatomy.hint} items={dict.anatomy.items} photo="/photos/install-hopper.jpg" alt={dict.installation.captions[2]} />
        </div>
      </section>

      <section className="bg-soft section">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div className="reveal">
            <h2 className="display text-3xl sm:text-4xl">{b.includesTitle}</h2>
            <ul className="mt-6 space-y-3">
              {b.includes.map((i) => (
                <li key={i} className="flex gap-3 border-b border-line pb-3 text-muted"><Check />{i}</li>
              ))}
            </ul>
          </div>
          <div className="reveal">
            <h2 className="display text-3xl sm:text-4xl">{b.optionsTitle}</h2>
            <ul className="mt-6 space-y-3">
              {b.options.map((i) => (
                <li key={i} className="flex gap-3 text-muted"><Check />{i}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">{b.fuel}</p>
            <div className="mt-8"><ButtonLink href={`/${lang}/contact`}>{b.request}</ButtonLink></div>
          </div>
        </div>
      </section>
    </>
  );
}
