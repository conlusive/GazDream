import { notFound } from "next/navigation";
import CalculatorClient from "@/components/CalculatorClient";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "../dictionaries";

export default async function CalculatorPage({ params }: PageProps<"/[lang]/calculator">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold sm:text-4xl">{dict.calc.title}</h1>
        <p className="mb-8 mt-2 text-muted">{dict.calc.lead}</p>
      </div>
      <CalculatorClient lang={lang} dict={dict.calc} />
    </div>
  );
}
