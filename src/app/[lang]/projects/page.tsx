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
      <PageHero eyebrow={dict.nav.projects} title={p.title} lead={p.lead} />

      <section className="section">
        <div className="container-x">
          <Installation dict={dict.installation} />
        </div>
      </section>

      <section className="border-t border-line bg-soft section">
        <div className="container-x">
          <h2 className="display reveal text-2xl sm:text-3xl">{p.other}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((x) => (
              <article key={x.key} className="card reveal p-6">
                <p className="text-sm text-muted">{p.items[x.key]}</p>
                <p className="tabular mt-3 text-4xl font-bold tracking-tight">
                  {x.powerMw}<span className="ml-1 text-xl font-semibold text-muted">MW</span>
                </p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">{p.fuel}</dt><dd className="font-semibold">{x.fuel === "chips" ? p.chips : p.moist}</dd></div>
                  {x.dryer && <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">{p.dryer}</dt><dd className="font-semibold">{x.dryer}</dd></div>}
                  {x.perDay && <div className="flex justify-between border-t border-line pt-2"><dt className="text-muted">{p.capacity}</dt><dd className="font-semibold">{x.perDay} {p.perDay}</dd></div>}
                </dl>
              </article>
            ))}
          </div>
          <article className="card reveal mt-4 p-6 sm:p-8">
            <h3 className="text-xl font-semibold">{p.featured}</h3>
            <p className="mt-3 max-w-3xl text-muted">{p.featuredText}</p>
          </article>
        </div>
      </section>
    </>
  );
}
