import { notFound } from "next/navigation";
import CalculatorClient from "@/components/CalculatorClient";
import PageHero from "@/components/PageHero";
import { hasLocale } from "@/i18n/config";
import { PHOTOS } from "@/lib/images";

import { getSettings } from "@/lib/settings";
import { fuelUseForCalc } from "@/lib/settings-schema";
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
  const [dict, settings] = await Promise.all([getDictionary(lang), getSettings()]);

  return (
    <>
      <div className="print:hidden">
        <PageHero eyebrow={dict.nav.calculator} title={dict.calc.title} lead={dict.calc.lead} image={PHOTOS.wide} />
      </div>
      <div className="container-x py-12 sm:py-16 print:p-0">
        <CalculatorClient lang={lang} dict={dict.calc} defaultPrices={settings.prices.table}
          pricesDate={settings.prices.updatedAt}
          privacyLabel={dict.footer.privacy}
          crops={settings.crops}
          fuelUse={{
            corn: fuelUseForCalc(settings.fuelUse.corn),
            soy: fuelUseForCalc(settings.fuelUse.soy),
            rapeseed: fuelUseForCalc(settings.fuelUse.rapeseed),
          }}
          vat={settings.vat}
          contacts={settings.contacts}
        />
      </div>
    </>
  );
}
