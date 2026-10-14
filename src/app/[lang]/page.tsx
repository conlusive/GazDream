import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CountUp from "@/components/CountUp";
import Faq from "@/components/Faq";
import Marquee from "@/components/Marquee";
import RevealHeading from "@/components/RevealHeading";
import ShowcaseSlider, { type Slide } from "@/components/ShowcaseSlider";
import Testimonials from "@/components/Testimonials";
import { ButtonLink } from "@/components/ui/Button";
import { hasLocale } from "@/i18n/config";
import { calculateBatches } from "@/lib/calculator";
import { MODELS, PROJECTS } from "@/lib/content";
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

  const slides: Slide[] = [
    {
      id: "case",
      kicker: dict.home.caseTitle,
      title: dict.projects.featured,
      text: dict.projects.featuredText,
      photo: "/photos/plant-3.jpg",
    },
    ...(["skrebyshi", "pereselenske", "buzovytsia"] as const).map((key, i): Slide => {
      const x = PROJECTS.find((pr) => pr.key === key)!;
      return {
        id: key,
        kicker: dict.nav.projects,
        big: `${x.powerMw} MW`,
        title: dict.projects.items[key],
        photo: ["/photos/site-1.jpg", "/photos/site-2.jpg", "/photos/site-3.jpg"][i],
        rows: [
          { label: dict.projects.fuel, value: x.fuel === "chips" ? dict.projects.chips : dict.projects.moist },
          ...(x.dryer ? [{ label: dict.projects.dryer, value: x.dryer }] : []),
          ...(x.perDay ? [{ label: dict.projects.capacity, value: `${x.perDay} ${dict.projects.perDay}` }] : []),
        ],
      };
    }),
  ];

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
          <RevealHeading lead={dict.hero.titleLead} highlight={dict.hero.titleHighlight} className="display max-w-3xl text-5xl sm:text-7xl" />
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

      <Marquee items={dict.marquee} />

      <section className="section">
        <div className="container-x">
          <p className="eyebrow reveal mb-4">GazDream</p>
          <h2 className="display reveal max-w-3xl text-3xl sm:text-5xl">{dict.benefits.title}</h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            <article className="reveal card-hover flex flex-col justify-between rounded-3xl bg-mint p-8 transition duration-300 ease-out-soft sm:p-10 lg:col-span-7 lg:min-h-[320px]">
              <p className="text-sm font-bold text-brand-orange">01</p>
              <div>
                <CountUp to={chips.savingsPercent} prefix="−" suffix="%" className="block text-7xl font-extrabold tracking-tight text-brand-green sm:text-8xl" />
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{dict.benefits.items[0].title}</h3>
                <p className="mt-2 max-w-md text-muted">{dict.benefits.items[0].text}</p>
              </div>
            </article>

            <article className="reveal group relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl p-8 text-white lg:col-span-5">
              <Image src="/photos/site-2.jpg" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="-z-20 object-cover transition-transform duration-[1400ms] ease-out-soft group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/90 via-forest/30 to-transparent" />
              <p className="text-sm font-bold text-brand-orange">03</p>
              <h3 className="mt-1 text-2xl font-extrabold tracking-tight">{dict.benefits.items[2].title}</h3>
              <p className="mt-2 max-w-sm text-white/80">{dict.benefits.items[2].text}</p>
            </article>

            <article className="reveal card card-hover flex flex-col justify-between p-8 sm:p-10 lg:col-span-5 lg:min-h-[280px]">
              <p className="text-sm font-bold text-brand-orange">02</p>
              <div>
                <p className="text-7xl font-extrabold tracking-tight text-ink sm:text-8xl">
                  <CountUp to={20} />
                  <span className="ml-2 text-3xl font-bold text-brand-green">MW</span>
                </p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{dict.benefits.items[1].title}</h3>
                <p className="mt-2 max-w-md text-muted">{dict.benefits.items[1].text}</p>
              </div>
            </article>

            <article className="reveal card-hover flex flex-col justify-between rounded-3xl bg-forest p-8 text-white transition duration-300 ease-out-soft sm:p-10 lg:col-span-7 lg:min-h-[280px]">
              <p className="text-sm font-bold text-brand-orange">04</p>
              <div>
                <p className="text-5xl font-extrabold tracking-tight text-leaf sm:text-6xl">{dict.hero.badge}</p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{dict.benefits.items[3].title}</h3>
                <p className="mt-2 max-w-md text-white/75">{dict.benefits.items[3].text}</p>
              </div>
            </article>
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
        <div className="container-x">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow reveal mb-4">{dict.home.caseTitle}</p>
              <h2 className="display reveal text-3xl sm:text-5xl">{dict.projects.title}</h2>
            </div>
            <Link href={`/${lang}/projects`} className="group reveal inline-flex items-center gap-2 text-sm font-bold text-brand-green">
              {dict.home.caseMore}
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
          <div className="reveal">
            <ShowcaseSlider slides={slides} caption={dict.home.illustrative} label={dict.projects.title} />
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
