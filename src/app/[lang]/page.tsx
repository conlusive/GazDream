import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import Installation from "@/components/Installation";
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

  // Example from the same calculation the calculator uses, with the current default prices.
  const currency = lang === "pl" ? "PLN" : "EUR";
  const example = calculateBatches({
    batches: [{ moistureFrom: 20, moistureTo: 14, tonnes: 1000 }],
    prices: prices.table[currency],
  });
  const chips = example.results.find((r) => r.fuel === "chips")!;
  const money = new Intl.NumberFormat(lang, { style: "currency", currency, maximumFractionDigits: 0, useGrouping: "always" });

  return (
    <>
      <section className="relative isolate flex min-h-[calc(100svh-64px)] flex-col overflow-hidden bg-forest text-white">
        <Image src="/photos/install-wide.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest/95 via-forest/75 to-forest/30" />

        <div className="container-x flex flex-1 flex-col justify-center py-20">
          <p className="rise mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">{dict.hero.badge}</p>
          <h1 className="display rise max-w-3xl text-4xl sm:text-6xl" style={{ animationDelay: "60ms" }}>{dict.hero.title}</h1>
          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/80" style={{ animationDelay: "120ms" }}>{dict.hero.subtitle}</p>
          <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "180ms" }}>
            <ButtonLink href={`/${lang}/calculator`}>{dict.cta.calculate}</ButtonLink>
            <ButtonLink href={`/${lang}/contact`} variant="light">{dict.cta.request}</ButtonLink>
          </div>
        </div>

        <dl className="container-x grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/20 py-6 lg:grid-cols-4">
          {dict.about.stats.map((s) => (
            <div key={s.l}>
              <dt className="text-xl font-bold tracking-tight sm:text-2xl">{s.v}</dt>
              <dd className="mt-1 text-xs text-white/65 sm:text-sm">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <div className="container-x">
          <h2 className="display reveal max-w-3xl text-3xl sm:text-4xl">{dict.benefits.title}</h2>
          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {dict.benefits.items.map((item, i) => (
              <div key={item.title} className="reveal border-t border-ink pt-5">
                <span className="tabular text-sm font-semibold text-muted">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 max-w-md text-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-soft section">
        <div className="container-x reveal">
          <Installation dict={dict.installation} />
          <div className="mt-10">
            <ButtonLink href={`/${lang}/projects`} variant="outline">{dict.installation.more}</ButtonLink>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display reveal text-3xl sm:text-4xl">{dict.home.modelsTitle}</h2>
            <Link href={`/${lang}/boilers`} className="reveal text-sm font-semibold text-brand-green hover:underline">
              {dict.home.modelsAll} →
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((m) => (
              <Link key={m.name} href={`/${lang}/boilers`} className="card card-hover reveal block p-6">
                <p className="text-sm text-muted">{dict.boilers.types[m.type]}</p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight">{m.name}</h3>
                <p className="mt-6 text-sm text-muted">{dict.boilers.power}</p>
                <p className="text-lg font-semibold">{m.powerKw} {dict.home.unitKw}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-forest text-white section">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <div className="reveal">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{dict.calc.title}</p>
            <h2 className="display text-3xl sm:text-4xl">{dict.calcTeaser.title}</h2>
            <p className="mt-4 max-w-md text-white/70">{dict.calcTeaser.text}</p>
            <div className="mt-8">
              <ButtonLink href={`/${lang}/calculator`}>{dict.cta.calculate}</ButtonLink>
            </div>
          </div>
          <div className="reveal border border-white/20 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{dict.home.exampleEyebrow}</p>
            <p className="tabular mt-4 text-6xl font-bold tracking-tight sm:text-7xl">−{chips.savingsPercent.toFixed(0)}%</p>
            <p className="tabular mt-2 text-xl font-semibold text-leaf">{money.format(chips.savingsVsGas)}</p>
            <p className="mt-4 text-sm text-white/70">{dict.home.exampleText}</p>
            <p className="mt-1 text-xs text-white/45">{dict.home.exampleNote}</p>
          </div>
        </div>
      </section>

      <Testimonials title={dict.testimonials.title} items={dict.testimonials.items} />

      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div className="reveal">
            <h2 className="display text-3xl sm:text-4xl">{dict.faq.title}</h2>
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
