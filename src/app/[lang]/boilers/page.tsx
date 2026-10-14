import Image from "next/image";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { hasLocale } from "@/i18n/config";
import { MODELS } from "@/lib/content";
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
  const { boilers: b, hero } = await getDictionary(lang);

  return (
    <>
      <PageHero eyebrow={hero.badge} title={b.title} lead={b.lead} />

      <section className="section !pb-10">
        <div className="container-x">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m) => (
              <article key={m.name} className="card card-hover reveal group flex flex-col border-t-4 border-t-transparent p-7 hover:border-t-brand-orange">
                <p className="text-sm font-semibold text-muted">{b.types[m.type]}</p>
                <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-brand-green">{m.name}</h2>
                <dl className="mt-6 space-y-4 text-sm">
                  <div className="border-t border-line pt-3">
                    <dt className="text-muted">{b.power}</dt>
                    <dd className="mt-0.5 text-lg font-extrabold">{m.powerKw}</dd>
                  </div>
                  <div className="border-t border-line pt-3">
                    <dt className="text-muted">{b.burner}</dt>
                    <dd className="mt-0.5 text-lg font-extrabold">{m.burnerKw}</dd>
                  </div>
                </dl>
                <div className="mt-7">
                  <ButtonLink href={`/${lang}/contact?model=${encodeURIComponent(m.name)}`} className="w-full">
                    {b.request}
                  </ButtonLink>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">{b.fuel}</p>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-2">
          <div className="reveal">
            <h2 className="display text-3xl sm:text-4xl">{b.includesTitle}</h2>
            <ul className="mt-6 space-y-3">
              {b.includes.map((i) => (
                <li key={i} className="flex gap-3 text-muted"><Check />{i}</li>
              ))}
            </ul>
            <h2 className="display mt-12 text-2xl sm:text-3xl">{b.optionsTitle}</h2>
            <ul className="mt-5 space-y-3">
              {b.options.map((i) => (
                <li key={i} className="flex gap-3 text-muted"><Check />{i}</li>
              ))}
            </ul>
          </div>
          <div className="reveal group self-start overflow-hidden rounded-3xl">
            <Image src="/photos/install-hopper.jpg" alt="" width={1280} height={960} className="w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105" />
          </div>
        </div>
      </section>
    </>
  );
}
