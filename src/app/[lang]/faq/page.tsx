import Link from "next/link";
import { notFound } from "next/navigation";
import Faq from "@/components/Faq";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "../dictionaries";

export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dict.faq.items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{dict.faq.title}</h1>
      <p className="mb-8 mt-3 text-lg text-muted">{dict.faq.lead}</p>
      <Faq items={dict.faq.items} />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/${lang}/calculator`} className="rounded-md bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark">
          {dict.cta.calculate}
        </Link>
        <Link href={`/${lang}/contact`} className="rounded-md border-2 border-brand-green px-6 py-3 font-semibold text-brand-green hover:bg-soft">
          {dict.cta.request}
        </Link>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
