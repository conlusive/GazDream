import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import Testimonials from "@/components/Testimonials";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "./dictionaries";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-green-dark text-white">
        <Image src="/photos/hero.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
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
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 lg:grid-cols-2">
          <figure>
            <Image src="/photos/plant-3.jpg" alt="" width={1272} height={900} className="rounded-xl" />
            <figcaption className="mt-2 text-xs text-muted">{dict.home.illustrative}</figcaption>
          </figure>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-green">{dict.home.caseTitle}</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{dict.projects.featured}</h2>
            <p className="mt-3 text-muted">{dict.projects.featuredText}</p>
            <Link href={`/${lang}/projects`} className="mt-5 inline-block font-semibold text-brand-green hover:underline">
              {dict.home.caseMore} →
            </Link>
          </div>
        </div>
      </section>

      <Testimonials title={dict.testimonials.title} items={dict.testimonials.items} />

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{dict.faq.title}</h2>
        <Faq items={dict.faq.items.slice(0, 3)} />
        <Link href={`/${lang}/faq`} className="mt-5 inline-block font-semibold text-brand-green hover:underline">
          {dict.faq.all} →
        </Link>
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
