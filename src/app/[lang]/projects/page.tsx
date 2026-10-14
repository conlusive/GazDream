import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { PROJECTS } from "@/lib/content";
import { getDictionary } from "../dictionaries";

export default async function ProjectsPage({ params }: PageProps<"/[lang]/projects">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const p = dict.projects;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{p.title}</h1>
      <p className="mt-3 text-lg text-muted">{p.lead}</p>

      <section className="my-8 grid items-center gap-6 rounded-xl bg-soft p-5 lg:grid-cols-2">
        <figure>
          <Image src="/photos/hero.jpg" alt="" width={1272} height={900} className="rounded-lg" />
          <figcaption className="mt-2 text-xs text-muted">{dict.home.illustrative}</figcaption>
        </figure>
        <div>
          <h2 className="text-2xl font-bold">{p.featured}</h2>
          <p className="mt-3 text-muted">{p.featuredText}</p>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((x) => (
          <article key={x.key} className="rounded-xl border border-line p-5">
            <h2 className="font-bold text-brand-green">{p.items[x.key]}</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{p.power}</dt><dd className="font-semibold">{x.powerMw} MW</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{p.fuel}</dt><dd className="font-semibold">{x.fuel === "chips" ? p.chips : p.moist}</dd></div>
              {x.dryer && <div className="flex justify-between"><dt className="text-muted">{p.dryer}</dt><dd className="font-semibold">{x.dryer}</dd></div>}
              {x.perDay && <div className="flex justify-between"><dt className="text-muted">{p.capacity}</dt><dd className="font-semibold">{x.perDay} {p.perDay}</dd></div>}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
