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
          <aside className="space-y-6 self-start rounded-lg bg-forest p-8 text-white sm:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{c.sales}</p>
              <a href={CONTACT.phoneHref} className="mt-2 block text-2xl font-bold tracking-tight">{CONTACT.phone}</a>
              <a href={`mailto:${CONTACT.email}`} className="mt-1 block break-all font-medium text-white/80 hover:text-white">{CONTACT.email}</a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{c.office}</p>
              <a href={CONTACT.officePhoneHref} className="mt-2 block font-semibold">{CONTACT.officePhone}</a>
              <a href={`mailto:${CONTACT.officeEmail}`} className="mt-1 block break-all font-medium text-white/80 hover:text-white">{CONTACT.officeEmail}</a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{c.address}</p>
              <p className="mt-2 font-semibold">{dict.footer.legalName}</p>
              <p className="text-white/75">{dict.footer.address}</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
