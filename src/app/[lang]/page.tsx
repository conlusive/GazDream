import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Applications from "@/components/Applications";
import AutoVideo from "@/components/AutoVideo";
import Faq from "@/components/Faq";
import HeroCard from "@/components/HeroCard";
import HowItWorks from "@/components/HowItWorks";
import Installation from "@/components/Installation";
import Marquee from "@/components/Marquee";
import RevealHeading from "@/components/RevealHeading";
import Testimonials from "@/components/Testimonials";
import { ButtonLink } from "@/components/ui/Button";
import { hasLocale } from "@/i18n/config";
import { calculateBatches, type Fuel } from "@/lib/calculator";
import { CONTACT, MODELS } from "@/lib/content";
import { PHOTOS } from "@/lib/images";
import { getPrices } from "@/lib/prices";
import { plain, rich } from "@/lib/rich";
import { getDictionary } from "./dictionaries";

const FUELS: Fuel[] = ["gas", "chips", "pellets"];

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
  const maxCost = Math.max(...example.results.map((r) => r.costPerTonne));
  const money2 = new Intl.NumberFormat(lang, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
  const labels = { close: dict.installation.close, prev: dict.installation.prev, next: dict.installation.next };

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-forest pt-24 text-white">
        <div className="absolute inset-0 -z-20">
          {/* The photo is the instant first frame; the silent loop fades in over it once it is playing. */}
          <Image src={PHOTOS.wide} alt="" fill priority placeholder="blur" sizes="100vw" className="object-cover" />
          <AutoVideo src="/video/hero-loop.mp4" eager className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-forest/85 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/80 to-forest/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest/90 via-transparent to-transparent" />

        <div className="container-x flex flex-1 flex-col justify-center gap-10 py-12 lg:flex-row lg:items-center lg:gap-14">
          <div className="lg:flex-1">
            <RevealHeading lead={dict.hero.titleLead} highlight={dict.hero.titleHighlight} className="display max-w-3xl text-5xl sm:text-6xl lg:text-7xl" />
            <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl" style={{ animationDelay: "180ms" }}>{dict.hero.subtitle}</p>
            <div className="rise mt-10 flex flex-wrap gap-3" style={{ animationDelay: "270ms" }}>
              <ButtonLink href={`/${lang}/calculator`}>{dict.cta.calculate}</ButtonLink>
              <ButtonLink href={`/${lang}/contact`} variant="light">{dict.cta.request}</ButtonLink>
            </div>
          </div>

          <HeroCard
            lang={lang}
            currency={currency}
            prices={prices.table[currency]}
            tonnesLabel={dict.calc.tonnes}
            gasLabel={dict.calc.fuels.gas}
            chipsLabel={dict.calc.fuels.chips}
            text={dict.home.card}
          />
        </div>

        <div className="rise border-t border-white/15" style={{ animationDelay: "500ms" }}>
          <p className="container-x flex flex-wrap items-center gap-x-6 gap-y-2 py-5 text-sm text-white/70">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{dict.home.worksWith}</span>
            {["Comil", "GSI", "Sukup"].map((n) => (
              <span key={n} className="numeral text-2xl text-white/90">{n}</span>
            ))}
          </p>
        </div>
      </section>

      {/* ---------- key figures ticker ---------- */}
      <Marquee items={dict.about.stats} label={plain(dict.home.proofTitle)} />

      {/* ---------- how it works ---------- */}
      <section className="section">
        <div className="container-x reveal">
          <HowItWorks eyebrow={dict.how.eyebrow} title={dict.how.title} hint={dict.how.hint} steps={dict.how.steps} />
        </div>
      </section>

      {/* ---------- savings ---------- */}
      <section className="bg-soft section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="reveal">
            <p className="eyebrow mb-4">{dict.savings.eyebrow}</p>
            <h2 className="display text-3xl sm:text-5xl">{rich(dict.savings.title)}</h2>
            <p className="lead mt-5 max-w-md">{dict.savings.text}</p>
            <div className="mt-8"><ButtonLink href={`/${lang}/calculator`}>{dict.savings.cta}</ButtonLink></div>
          </div>
          <div className="reveal card p-7 sm:p-10">
            <div className="space-y-7">
              {FUELS.map((f) => {
                const r = example.results.find((x) => x.fuel === f)!;
                const best = f === example.cheapest;
                return (
                  <div key={f}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-extrabold">{dict.calc.fuels[f]}</span>
                      <span className="tabular text-lg font-extrabold">{money2.format(r.costPerTonne)} <span className="text-sm font-semibold text-muted">/ t</span></span>
                    </div>
                    <div className="mt-2 h-4 overflow-hidden rounded-full bg-line">
                      <div className={`grow h-full rounded-full ${best ? "bg-brand-green" : f === "gas" ? "bg-brand-orange" : "bg-ink/35"}`} style={{ width: `${(r.costPerTonne / maxCost) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-end justify-between gap-4 border-t border-line pt-6">
              <div>
                <p className="numeral text-6xl text-brand-green">−{chips.savingsPercent.toFixed(0)}%</p>
                <p className="mt-1 text-sm text-muted">{dict.calc.fuels.chips} vs {dict.calc.fuels.gas}</p>
              </div>
              <p className="max-w-[14rem] text-right text-xs text-muted">{dict.home.exampleText}<br />{dict.savings.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- applications ---------- */}
      <section className="section">
        <div className="container-x">
          <p className="eyebrow reveal mb-4">{dict.apps.eyebrow}</p>
          <h2 className="display reveal mb-12 max-w-3xl text-3xl sm:text-5xl">{rich(dict.apps.title)}</h2>
          <div className="reveal">
            <Applications tabs={dict.apps.tabs} cta={dict.apps.cta} href={`/${lang}/contact`} />
          </div>
        </div>
      </section>

      {/* ---------- real project ---------- */}
      <section className="bg-soft section">
        <div className="container-x reveal">
          <Installation dict={dict.installation} labels={labels} />
          <div className="mt-12">
            <ButtonLink href={`/${lang}/projects`} variant="outline">{dict.installation.more}</ButtonLink>
          </div>
        </div>
      </section>

      {/* ---------- models: power-range chart; full details live on the Boilers page ---------- */}
      <section className="section">
        <div className="container-x">
          <div className="reveal flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow mb-4">{dict.home.modelsEyebrow}</p>
              <h2 className="display text-3xl sm:text-5xl">{rich(dict.home.modelsTitle)}</h2>
            </div>
            <ButtonLink href={`/${lang}/boilers`} variant="outline">{dict.home.modelsAll}</ButtonLink>
          </div>

          <div className="reveal card mt-10 p-5 sm:p-8">
            {/* axis: 0 - 6000 kW */}
            <div className="hidden items-center gap-4 sm:flex">
              <div className="w-32 shrink-0" />
              <div className="relative h-5 flex-1 text-xs font-semibold text-muted" aria-hidden="true">
                {[0, 1000, 2000, 3000, 4000, 5000, 6000].map((t) => (
                  <span key={t} className="tabular absolute top-0 -translate-x-1/2" style={{ left: `${(t / 6000) * 100}%` }}>{t}</span>
                ))}
              </div>
              <div className="w-28 shrink-0 text-right text-xs font-semibold text-muted">{dict.home.unitKw}</div>
            </div>

            <ul className="mt-2 space-y-2">
              {MODELS.map((m) => {
                const [lo, hi] = m.powerKw.split("–").map(Number);
                return (
                  <li key={m.name}>
                    <Link href={`/${lang}/boilers`} className="group flex flex-col gap-2 rounded-xl px-2 py-3 transition-colors duration-300 hover:bg-tint sm:flex-row sm:items-center sm:gap-4">
                      <span className="flex items-baseline justify-between gap-3 sm:block sm:w-32 sm:shrink-0">
                        <span className="block text-xl font-extrabold tracking-tight transition-colors group-hover:text-brand-green">{m.name}</span>
                        <span className="text-xs text-muted">{dict.boilers.types[m.type]}</span>
                      </span>
                      <span
                        className="relative block h-6 w-full rounded-full bg-line/60 sm:w-auto sm:flex-1"
                        style={{ backgroundImage: "linear-gradient(to right, rgba(17,32,24,0.07) 1px, transparent 1px)", backgroundSize: "16.6667% 100%" }}
                        aria-hidden="true"
                      >
                        <span
                          className="grow absolute inset-y-0 rounded-full bg-brand-green transition-colors duration-300 group-hover:bg-brand-green-dark"
                          style={{ left: `${(lo / 6000) * 100}%`, width: `${((hi - lo) / 6000) * 100}%` }}
                        />
                      </span>
                      <span className="tabular text-base font-bold sm:w-28 sm:shrink-0 sm:text-right">{m.powerKw} <span className="text-sm font-semibold text-muted">{dict.home.unitKw}</span></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <Testimonials title={dict.testimonials.title} items={dict.testimonials.items} />

      {/* ---------- FAQ ---------- */}
      <section className="bg-soft section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div className="reveal">
            <p className="eyebrow mb-4">FAQ</p>
            <h2 className="display text-3xl sm:text-5xl">{rich(dict.faq.title)}</h2>
            <div className="mt-8"><ButtonLink href={`/${lang}/faq`} variant="outline">{dict.faq.all}</ButtonLink></div>
          </div>
          <div className="reveal"><Faq items={dict.faq.items.slice(0, 4)} /></div>
        </div>
      </section>

      {/* ---------- final call to action ---------- */}
      <section className="pb-16 sm:pb-24">
        <div className="container-x">
          <div className="reveal relative isolate overflow-hidden rounded-3xl bg-forest p-8 text-white sm:p-14">
            <Image src={PHOTOS.hall} alt="" fill placeholder="blur" sizes="100vw" className="-z-20 object-cover opacity-25" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest via-forest/90 to-forest/50" />
            <h2 className="display max-w-2xl text-3xl sm:text-5xl">{rich(dict.home.ctaTitle)}</h2>
            <p className="mt-4 max-w-xl text-white/75">{dict.home.ctaText}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href={`/${lang}/contact`}>{dict.cta.request}</ButtonLink>
              <a href={CONTACT.phoneHref} className="btn btn-light">{dict.home.ctaCall}: {CONTACT.phone}</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
