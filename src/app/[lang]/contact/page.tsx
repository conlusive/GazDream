import { Suspense } from "react";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";
import { hasLocale } from "@/i18n/config";
import { CONTACT } from "@/lib/content";
import { getDictionary } from "../dictionaries";

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const c = dict.contact;

  return (
    <>
      <PageHero eyebrow={dict.nav.contact} title={c.title} lead={c.lead} />
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div className="card p-7 sm:p-10">
            <Suspense>
              <ContactForm lang={lang} dict={c} />
            </Suspense>
          </div>
          <aside className="space-y-6 self-start rounded-3xl bg-forest p-8 text-white sm:p-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{dict.cta.call}</p>
              <a href={CONTACT.phoneHref} className="mt-2 block text-3xl font-extrabold tracking-tight transition hover:text-leaf">{CONTACT.phone}</a>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{c.email}</p>
              <a href={`mailto:${CONTACT.email}`} className="mt-2 block break-all text-lg font-bold transition hover:text-leaf">{CONTACT.email}</a>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{c.address}</p>
              <p className="mt-2 font-bold">{dict.footer.legalName}</p>
              <p className="text-white/75">{dict.footer.address}</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
