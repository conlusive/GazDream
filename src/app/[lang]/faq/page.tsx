import { notFound } from "next/navigation";
import FaqList from "@/components/FaqList";
import PageHero from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
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
    <>
      <PageHero eyebrow="FAQ" title={dict.faq.title} lead={dict.faq.lead} image="/photos/install-container.jpg" />
      <section className="section">
        <div className="container-x max-w-3xl">
          <FaqList items={dict.faq.items} placeholder={dict.faqSearch.placeholder} none={dict.faqSearch.none} />
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href={`/${lang}/calculator`}>{dict.cta.calculate}</ButtonLink>
            <ButtonLink href={`/${lang}/contact`} variant="outline">{dict.cta.request}</ButtonLink>
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
