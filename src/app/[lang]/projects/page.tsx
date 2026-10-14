import Image from "next/image";
import { notFound } from "next/navigation";
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

      <section className="section !pb-10">
        <div className="container-x">
          <div className="reveal grid items-stretch overflow-hidden rounded-3xl bg-forest text-white lg:grid-cols-2">
            <figure className="relative min-h-[260px] overflow-hidden">
              <Image src="/photos/hero.jpg" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              <figcaption className="sr-only">{dict.home.illustrative}</figcaption>
            </figure>
            <div className="p-8 sm:p-12">
              <p className="eyebrow !text-leaf mb-4">{dict.home.caseTitle}</p>
              <h2 className="display text-2xl sm:text-4xl">{p.featured}</h2>
              <p className="mt-5 text-white/75">{p.featuredText}</p>
              <p className="mt-6 text-xs text-white/50">{dict.home.illustrative}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((x) => (
            <article key={x.key} className="card card-hover reveal p-7">
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
      </section>
    </>
  );
}
