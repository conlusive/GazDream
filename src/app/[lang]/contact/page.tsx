import { Suspense } from "react";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";
import { hasLocale } from "@/i18n/config";
import { PHOTOS } from "@/lib/images";

import { CONTACT } from "@/lib/content";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return pageMetadata(lang, await getDictionary(lang), "contact", "/contact");
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const c = dict.contact;

  return (
    <>
      <PageHero eyebrow={dict.nav.contact} title={c.title} lead={c.lead} image={PHOTOS.hall} />
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="card p-7 sm:p-10">
            <Suspense>
              <ContactForm lang={lang} dict={c} />
            </Suspense>
          </div>
          <aside className="space-y-6 self-start rounded-3xl bg-forest p-8 text-white sm:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">{c.sales}</p>
              <a href={CONTACT.phoneHref} className="mt-1 block py-1.5 text-2xl font-bold tracking-tight">{CONTACT.phone}</a>
              <a href={`mailto:${CONTACT.email}`} className="block break-all py-2 font-medium text-white/80 hover:text-white">{CONTACT.email}</a>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">{c.office}</p>
              <a href={CONTACT.officePhoneHref} className="mt-1 block py-2 font-semibold">{CONTACT.officePhone}</a>
              <a href={`mailto:${CONTACT.officeEmail}`} className="block break-all py-2 font-medium text-white/80 hover:text-white">{CONTACT.officeEmail}</a>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">{c.address}</p>
              <p className="mt-2 font-semibold">{dict.footer.legalName}</p>
              <p className="text-white/75">{dict.footer.address}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-soft section">
        <div className="container-x">
          <h2 className="display reveal text-2xl sm:text-4xl">{c.steps.title}</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {c.steps.items.map((step, i) => (
              <li key={step.t} className="card reveal p-7">
                <span className="numeral text-5xl text-brand-orange">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-extrabold">{step.t}</h3>
                <p className="mt-2 text-muted">{step.x}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
