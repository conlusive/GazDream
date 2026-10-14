import Image from "next/image";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { hasLocale } from "@/i18n/config";
import { PHOTOS } from "@/lib/images";

import { rich } from "@/lib/rich";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return pageMetadata(lang, await getDictionary(lang), "about", "/about");
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const { about, adv, fuelsInfo } = dict;

  return (
    <>
      <PageHero eyebrow={dict.hero.badge} title={about.title} lead={about.lead} image={PHOTOS.container} />

      <section className="section">
        <dl className="container-x grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {about.stats.map((s) => (
            <div key={s.l} className="reveal min-w-0 border-t border-ink/15 pt-5">
              <dt className="numeral text-4xl text-brand-green sm:text-5xl">{s.v}</dt>
              <dd className="mt-3 text-sm text-muted [overflow-wrap:anywhere]">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-soft section">
        <div className="container-x">
          <p className="eyebrow reveal mb-4">{about.techTitle}</p>
          <h2 className="display reveal max-w-3xl text-3xl sm:text-5xl">{rich(adv.title.replace(/(\S+)$/, "*$1*"))}</h2>
          <p className="lead reveal mt-5 max-w-2xl">{about.tech}</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {adv.items.map((item, i) => (
              <article key={item.t} className="card card-hover reveal group border-t-4 border-t-transparent p-7 hover:border-t-brand-orange">
                <span className="numeral text-3xl text-brand-orange">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-extrabold tracking-tight transition-colors group-hover:text-brand-green">{item.t}</h3>
                <p className="mt-2 text-muted">{item.x}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal">
            <h2 className="display text-3xl sm:text-4xl">{fuelsInfo.title}</h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">{fuelsInfo.main}</p>
                <ul className="space-y-2">
                  {fuelsInfo.mainItems.map((f) => (
                    <li key={f} className="flex gap-3 border-b border-line pb-2 font-semibold"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />{f}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow mb-3 !text-muted">{fuelsInfo.aux}</p>
                <ul className="space-y-2 text-muted">
                  {fuelsInfo.auxItems.map((f) => (
                    <li key={f} className="flex gap-3 border-b border-line pb-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-line" />{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="reveal overflow-hidden rounded-3xl">
            <Image src={PHOTOS.container} alt={dict.installation.captions[1]} placeholder="blur" sizes="(min-width: 1024px) 50vw, 100vw" className="transition-transform duration-700 ease-out-soft hover:scale-105" />
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container-x">
          <div className="reveal flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-forest p-8 text-white sm:p-12">
            <div className="max-w-xl">
              <h2 className="text-2xl font-extrabold sm:text-3xl">{about.officeTitle}</h2>
              <p className="mt-2 text-white/75">{about.officeText}</p>
            </div>
            <ButtonLink href={`/${lang}/contact`}>{dict.cta.request}</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
