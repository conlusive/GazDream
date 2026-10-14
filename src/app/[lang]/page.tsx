import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "./dictionaries";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <section className="bg-brand-green-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="mb-4 inline-block rounded border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            {dict.hero.badge}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">{dict.hero.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85">{dict.hero.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={`/${lang}/calculator`} className="rounded-md bg-brand-orange px-6 py-3 font-semibold hover:bg-brand-orange-dark">
              {dict.cta.calculate}
            </Link>
            <Link href={`/${lang}/contact`} className="rounded-md border border-white/60 px-6 py-3 font-semibold hover:bg-white/10">
              {dict.cta.request}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-2xl font-bold sm:text-3xl">{dict.benefits.title}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.benefits.items.map((item) => (
            <div key={item.title} className="rounded-lg border border-line p-5">
              <h3 className="mb-2 font-semibold text-brand-green">{item.title}</h3>
              <p className="text-sm text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">{dict.calcTeaser.title}</h2>
            <p className="mt-1 text-muted">{dict.calcTeaser.text}</p>
          </div>
          <Link href={`/${lang}/calculator`} className="rounded-md bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark">
            {dict.cta.calculate}
          </Link>
        </div>
      </section>
    </>
  );
}
