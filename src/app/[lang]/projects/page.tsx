import { notFound } from "next/navigation";
import Installation from "@/components/Installation";
import PageHero from "@/components/PageHero";
import { hasLocale } from "@/i18n/config";
import { PROJECTS } from "@/lib/content";
import { getDictionary } from "../dictionaries";

export default async function ProjectsPage({ params }: PageProps<"/[lang]/projects">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const p = dict.projects;

  return (
    <>
      <PageHero eyebrow={dict.nav.projects} title={p.title} lead={p.lead} image="/photos/install-hall.jpg" />

      <section className="border-b border-line">
        <dl className="container-x grid grid-cols-3 gap-6 py-10">
          <div><dt className="numeral text-5xl text-brand-green sm:text-6xl">{PROJECTS.length}</dt><dd className="mt-2 text-sm text-muted">{p.summary.objects}</dd></div>
          <div><dt className="numeral text-5xl text-brand-green sm:text-6xl">2,5–6,0</dt><dd className="mt-2 text-sm text-muted">{p.summary.power} (MW)</dd></div>
          <div><dt className="numeral text-5xl text-brand-green sm:text-6xl">600</dt><dd className="mt-2 text-sm text-muted">{p.summary.capacity} {p.perDay}</dd></div>
        </dl>
      </section>

      <section className="section">
        <div className="container-x">
          <Installation dict={dict.installation} labels={{ close: dict.installation.close, prev: dict.installation.prev, next: dict.installation.next }} />
        </div>
      </section>

      <section className="bg-soft section">
        <div className="container-x">
          <h2 className="display reveal text-2xl sm:text-4xl">{p.other}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((x) => (
              <article key={x.key} className="card card-hover reveal border-t-4 border-t-brand-green p-7">
                <p className="text-sm font-semibold text-muted">{p.items[x.key]}</p>
                <p className="tabular mt-3 text-5xl font-extrabold tracking-tight text-brand-green">
                  {x.powerMw}<span className="ml-1 text-2xl font-bold text-ink">MW</span>
                </p>
                <dl className="mt-6 space-y-2 text-sm">
                  <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">{p.fuel}</dt><dd className="font-bold">{x.fuel === "chips" ? p.chips : p.moist}</dd></div>
                  {x.dryer && <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">{p.dryer}</dt><dd className="font-bold">{x.dryer}</dd></div>}
                  {x.perDay && <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">{p.capacity}</dt><dd className="font-bold">{x.perDay} {p.perDay}</dd></div>}
                </dl>
              </article>
            ))}
          </div>
          <article className="card reveal mt-5 p-7 sm:p-9">
            <h3 className="text-xl font-extrabold">{p.featured}</h3>
            <p className="mt-3 max-w-3xl text-muted">{p.featuredText}</p>
          </article>
        </div>
      </section>
    </>
  );
}
