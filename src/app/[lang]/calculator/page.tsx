import { notFound } from "next/navigation";
import CalculatorClient from "@/components/CalculatorClient";
import PageHero from "@/components/PageHero";
import { hasLocale } from "@/i18n/config";
import { getPrices } from "@/lib/prices";
import { getDictionary } from "../dictionaries";

export default async function CalculatorPage({ params }: PageProps<"/[lang]/calculator">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, prices] = await Promise.all([getDictionary(lang), getPrices()]);

  return (
    <>
      <div className="print:hidden">
        <PageHero eyebrow={dict.nav.calculator} title={dict.calc.title} lead={dict.calc.lead} image="/photos/install-wide.jpg" />
      </div>
      <div className="container-x py-12 sm:py-16 print:p-0">
        <CalculatorClient lang={lang} dict={dict.calc} defaultPrices={prices.table} pricesDate={prices.updatedAt} />
      </div>
    </>
  );
}
