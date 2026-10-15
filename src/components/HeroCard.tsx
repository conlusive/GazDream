"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";
import { calculateBatches, type Fuel } from "@/lib/calculator";
import type { Locale } from "@/i18n/config";

type Props = {
  lang: Locale;
  currency: "EUR" | "PLN";
  prices: Record<Fuel, number>;
  fuelUse: Record<Fuel, number>;
  tonnesLabel: string;
  gasLabel: string;
  chipsLabel: string;
  text: { title: string; question: string; save: string; gasVsChips: string; assume: string; cta: string };
};

const VOLUMES = [500, 1000, 5000, 20000];
export const TONNES_KEY = "gd_tonnes";

/** Hero mini-calculator: pick a volume, see the savings on it, carry the number into the full calculator. */
export default function HeroCard({ lang, currency, prices, fuelUse, tonnesLabel, gasLabel, chipsLabel, text }: Props) {
  const [tonnes, setTonnes] = useState(5000);

  const result = useMemo(
    () => calculateBatches({ batches: [{ moistureFrom: 20, moistureTo: 14, tonnes }], prices, fuelUse }),
    [tonnes, prices, fuelUse],
  );
  const gas = result.results.find((r) => r.fuel === "gas")!;
  const chips = result.results.find((r) => r.fuel === "chips")!;
  const money = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0, useGrouping: "always" }),
    [lang, currency],
  );
  const share = gas.totalCost > 0 ? (chips.totalCost / gas.totalCost) * 100 : 0;

  const remember = () => {
    try {
      sessionStorage.setItem(TONNES_KEY, String(tonnes));
    } catch {
      /* storage can be blocked; the calculator just opens with its defaults */
    }
  };

  return (
    <aside className="rise w-full rounded-3xl border border-white/20 bg-forest/75 p-6 sm:p-8 lg:w-[24rem] lg:shrink-0" style={{ animationDelay: "420ms" }}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">{text.title}</p>
      <h2 className="mt-2 text-lg font-bold leading-snug">{text.question}</h2>

      <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label={`${text.question} (${tonnesLabel})`}>
        {VOLUMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTonnes(t)}
            aria-pressed={tonnes === t}
            className={`tabular min-h-11 rounded-full border px-1 text-sm font-bold transition-colors duration-200 ${
              tonnes === t ? "border-brand-orange bg-brand-orange text-white" : "border-white/30 text-white/90 hover:border-white hover:bg-white/10"
            }`}
          >
            {t.toLocaleString(lang)}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold text-white/70">{text.save}</p>
      <p className="tabular mt-1 text-5xl font-extrabold leading-none tracking-tight sm:text-6xl" aria-live="polite">
        <AnimatedNumber value={chips.savingsVsGas} format={money.format} />
      </p>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold text-white/60">{text.gasVsChips}</p>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm"><span>{gasLabel}</span><span className="tabular font-bold"><AnimatedNumber value={gas.totalCost} format={money.format} /></span></div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full w-full rounded-full bg-brand-orange" /></div>
          </div>
          <div>
            <div className="flex justify-between text-sm"><span>{chipsLabel}</span><span className="tabular font-bold text-leaf"><AnimatedNumber value={chips.totalCost} format={money.format} /></span></div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-leaf transition-[width] duration-700 ease-out" style={{ width: `${share}%` }} /></div>
          </div>
        </div>
      </div>

      <Link
        href={`/${lang}/calculator`}
        onClick={remember}
        className="btn btn-primary group mt-6 w-full"
      >
        {text.cta}
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
      </Link>
      <p className="mt-3 text-xs text-white/50">{text.assume}</p>
    </aside>
  );
}
