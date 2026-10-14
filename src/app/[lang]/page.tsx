import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import Testimonials from "@/components/Testimonials";
import { ButtonLink } from "@/components/ui/Button";
import { hasLocale } from "@/i18n/config";
import { calculateBatches } from "@/lib/calculator";
import { MODELS } from "@/lib/content";
import { getPrices } from "@/lib/prices";
import { getDictionary } from "./dictionaries";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, prices] = await Promise.all([getDictionary(lang), getPrices()]);

  // Live example from the same calculation the calculator uses, with the current default prices.
  const currency = lang === "pl" ? "PLN" : "EUR";
  const example = calculateBatches({
    batches: [{ moistureFrom: 20, moistureTo: 14, tonnes: 1000 }],
    prices: prices.table[currency],
  });
  const chips = example.results.find((r) => r.fuel === "chips")!;
  const money = new Intl.NumberFormat(lang, { style: "currency", currency, maximumFractionDigits: 0, useGrouping: "always" });

  return (
    <>
      <section className="relative isolate flex min-h-[calc(100svh-68px)] flex-col overflow-hidden bg-forest text-white">
        <Image src="/photos/hero.jpg" alt="" fill priority sizes="100vw" className="kenburns -z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/80 to-forest/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/90 via-transparent to-transparent" />

        <div className="container-x flex flex-1 flex-col justify-center py-20">
          <p className="rise mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
            {dict.hero.badge}
          </p>
          <h1 className="display rise max-w-3xl text-5xl sm:text-7xl" style={{ animationDelay: "90ms" }}>
            {dict.hero.title}
          </h1>
          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl" style={{ animationDelay: "180ms" }}>
            {dict.hero.subtitle}
          </p>
          <div className="rise mt-10 flex flex-wrap gap-3" style={{ animationDelay: "270ms" }}>
            <ButtonLink href={`/${lang}/calculator`}>{dict.cta.calculate}</ButtonLink>
            <ButtonLink href={`/${lang}/contact`} variant="light">{dict.cta.request}</ButtonLink>
          </div>
        </div>

        <dl className="rise container-x grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 py-7 lg:grid-cols-4" style={{ animationDelay: "380ms" }}>
          {dict.about.stats.map((s) => (
            <div key={s.l}>
              <dt className="text-xl font-extrabold tracking-tight sm:text-2xl">{s.v}</dt>
              <dd className="mt-1 text-xs text-white/70 sm:text-sm">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <div className="container-x">
          <p className="eyebrow reveal mb-4">GazDream</p>
          <h2 className="display reveal max-w-3xl text-3xl sm:text-5xl">{dict.benefits.title}</h2>
          <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {dict.benefits.items.map((item, i) => (
              <div key={item.title} className="reveal group border-t border-line pt-6 transition-colors duration-300 hover:border-brand-green">
                <span className="text-sm font-bold text-brand-orange">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-xl font-extrabold tracking-tight transition-colors group-hover:text-brand-green sm:text-2xl">{item.title}</h3>
                <p className="mt-2 max-w-md text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-soft section">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow reveal mb-4">{dict.home.modelsEyebrow}</p>
              <h2 className="display reveal text-3xl sm:text-5xl">{dict.home.modelsTitle}</h2>
            </div>
            <Link href={`/${lang}/boilers`} className="group reveal inline-flex items-center gap-2 text-sm font-bold text-brand-green">
              {dict.home.modelsAll}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m) => (
              <Link key={m.name} href={`/${lang}/boilers`} className="card card-hover reveal group block p-6">
                <p className="text-sm font-semibold text-muted">{dict.boilers.types[m.type]}</p>
                <h3 className="mt-1 text-3xl font-extrabold tracking-tight transition-colors group-hover:text-brand-green">{m.name}</h3>
                <p className="mt-6 text-sm text-muted">{dict.boilers.power}</p>
                <p className="text-lg font-bold">{m.powerKw} {dict.home.unitKw}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="reveal grid items-center gap-10 overflow-hidden rounded-3xl bg-forest p-8 text-white sm:p-14 lg:grid-cols-2">
            <div>
              <p className="eyebrow !text-leaf mb-4">{dict.calc.title}</p>
              <h2 className="display text-3xl sm:text-5xl">{dict.calcTeaser.title}</h2>
              <p className="mt-4 max-w-md text-white/75">{dict.calcTeaser.text}</p>
              <div className="mt-8">
                <ButtonLink href={`/${lang}/calculator`}>{dict.cta.calculate}</ButtonLink>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-7 sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{dict.home.exampleEyebrow}</p>
              <p className="tabular mt-4 text-6xl font-extrabold tracking-tight text-leaf sm:text-7xl">−{chips.savingsPercent.toFixed(0)}%</p>
              <p className="tabular mt-2 text-xl font-bold">{money.format(chips.savingsVsGas)}</p>
              <p className="mt-4 text-sm text-white/70">{dict.home.exampleText}</p>
              <p className="mt-1 text-xs text-white/50">{dict.home.exampleNote}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-soft section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <figure className="reveal">
            <div className="overflow-hidden rounded-3xl">
              <Image src="/photos/plant-3.jpg" alt="" width={1272} height={900} className="transition-transform duration-700 ease-out-soft hover:scale-105" />
            </div>
            <figcaption className="mt-3 text-xs text-muted">{dict.home.illustrative}</figcaption>
          </figure>
          <div className="reveal">
            <p className="eyebrow mb-4">{dict.home.caseTitle}</p>
            <h2 className="display text-3xl sm:text-4xl">{dict.projects.featured}</h2>
            <p className="mt-5 text-muted">{dict.projects.featuredText}</p>
            <div className="mt-8">
              <ButtonLink href={`/${lang}/projects`} variant="outline">{dict.home.caseMore}</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <Testimonials title={dict.testimonials.title} items={dict.testimonials.items} />

      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="reveal">
            <p className="eyebrow mb-4">FAQ</p>
            <h2 className="display text-3xl sm:text-5xl">{dict.faq.title}</h2>
            <div className="mt-8">
              <ButtonLink href={`/${lang}/faq`} variant="outline">{dict.faq.all}</ButtonLink>
            </div>
          </div>
          <div className="reveal">
            <Faq items={dict.faq.items.slice(0, 4)} />
          </div>
        </div>
      </section>
    </>
  );
}
