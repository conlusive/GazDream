import { notFound } from "next/navigation";
import CalculatorClient from "@/components/CalculatorClient";
import PageHero from "@/components/PageHero";
import { hasLocale } from "@/i18n/config";
import { PHOTOS } from "@/lib/images";

import { getPrices } from "@/lib/prices";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/calculator">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return pageMetadata(lang, await getDictionary(lang), "calculator", "/calculator");
}

export default async function CalculatorPage({ params }: PageProps<"/[lang]/calculator">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, prices] = await Promise.all([getDictionary(lang), getPrices()]);

  return (
    <>
      <div className="print:hidden">
        <PageHero eyebrow={dict.nav.calculator} title={dict.calc.title} lead={dict.calc.lead} image={PHOTOS.wide} />
      </div>
      <div className="container-x py-12 sm:py-16 print:p-0">
        <CalculatorClient lang={lang} dict={dict.calc} defaultPrices={prices.table} pricesDate={prices.updatedAt} privacyLabel={dict.footer.privacy} />
      </div>
    </>
  );
}
