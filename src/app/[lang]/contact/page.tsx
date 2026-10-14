import { Suspense } from "react";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { hasLocale } from "@/i18n/config";
import { CONTACT } from "@/lib/content";
import { getDictionary } from "../dictionaries";

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const c = dict.contact;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{c.title}</h1>
      <p className="mb-8 mt-3 max-w-2xl text-muted">{c.lead}</p>
      <div className="grid gap-10 lg:grid-cols-2">
        <Suspense>
          <ContactForm lang={lang} dict={c} />
        </Suspense>
        <div className="space-y-4 text-sm">
          <div className="hidden gap-3 lg:flex">
            <a href={CONTACT.phoneHref} className="rounded-md bg-brand-green px-4 py-2 font-semibold text-white">{dict.cta.call}: {CONTACT.phone}</a>
          </div>
          <p><span className="text-muted">{c.email}:</span> <a className="font-semibold" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
          <p><span className="text-muted">{c.address}:</span> <strong>{dict.footer.legalName}, {dict.footer.address}</strong></p>
        </div>
      </div>
    </div>
  );
}
