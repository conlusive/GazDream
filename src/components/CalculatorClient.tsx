"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { calculate, type Fuel } from "@/lib/calculator";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";

type Crop = "corn" | "soy" | "rapeseed";
type Currency = "EUR" | "PLN";
type Period = "day" | "season" | "year";

const CROP_TARGET: Record<Crop, number> = { corn: 14, soy: 13, rapeseed: 8 };
const CROP_START: Record<Crop, number> = { corn: 20, soy: 18, rapeseed: 12 };
// Placeholder market prices, to be managed from the admin screen later.
const DEFAULT_PRICES: Record<Currency, Record<Fuel, number>> = {
  EUR: { gas: 400, chips: 70, pellets: 160 },
  PLN: { gas: 1700, chips: 300, pellets: 690 },
};
const VAT_RATE: Record<Locale, number> = { pl: 0.23, de: 0.19, en: 0.2 };
const FUEL_ORDER: Fuel[] = ["gas", "chips", "pellets"];

const num = (v: string) => (v === "" ? 0 : Number(v.replace(",", ".")) || 0);

export default function CalculatorClient({ lang, dict }: { lang: Locale; dict: Dictionary["calc"] }) {
  const [currency, setCurrency] = useState<Currency>(lang === "pl" ? "PLN" : "EUR");
  const [crop, setCrop] = useState<Crop>("corn");
  const [from, setFrom] = useState(CROP_START.corn);
  const [to, setTo] = useState(CROP_TARGET.corn);
  const [tonnes, setTonnes] = useState("1000");
  const [period, setPeriod] = useState<Period>("season");
  const [prices, setPrices] = useState<Record<Fuel, string>>(() => {
    const p = DEFAULT_PRICES[lang === "pl" ? "PLN" : "EUR"];
    return { gas: String(p.gas), chips: String(p.chips), pellets: String(p.pellets) };
  });
  const [withVat, setWithVat] = useState(false);

  const money = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency, maximumFractionDigits: 0 }),
    [lang, currency],
  );
  const money2 = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [lang, currency],
  );

  const result = useMemo(
    () =>
      calculate({
        moistureFrom: from,
        moistureTo: to,
        tonnes: num(tonnes),
        prices: { gas: num(prices.gas), chips: num(prices.chips), pellets: num(prices.pellets) },
        vatRate: withVat ? VAT_RATE[lang] : 0,
      }),
    [from, to, tonnes, prices, withVat, lang],
  );

  const pickCrop = (c: Crop) => {
    setCrop(c);
    setFrom(CROP_START[c]);
    setTo(CROP_TARGET[c]);
  };
  const pickCurrency = (c: Currency) => {
    setCurrency(c);
    const p = DEFAULT_PRICES[c];
    setPrices({ gas: String(p.gas), chips: String(p.chips), pellets: String(p.pellets) });
  };

  const maxCost = Math.max(...result.results.map((r) => r.costPerTonne), 0.0001);
  const winner = result.results.find((r) => r.fuel === result.cheapest);
  const winnerSaves = winner && winner.fuel !== "gas" && winner.savingsVsGas > 0;

  const calcSummary = winnerSaves
    ? `${dict.crops[crop]}, ${tonnes} ${dict.tonnes} ${dict.period[period]}, ${dict.fuels[winner.fuel]}: ${money.format(winner.savingsVsGas)}`
    : "";

  const field = "w-full rounded-md border border-line px-3 py-2 text-base focus:border-brand-green focus:outline-none";
  const label = "mb-1 block text-sm font-semibold";

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <fieldset>
          <legend className={label}>{dict.crop}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CROP_TARGET) as Crop[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickCrop(c)}
                aria-pressed={crop === c}
                className={`rounded-lg border-2 px-2 py-4 text-sm font-semibold ${
                  crop === c ? "border-brand-green bg-brand-green text-white" : "border-line hover:border-brand-green"
                }`}
              >
                {dict.crops[c]}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className={label} htmlFor="from">{dict.moistureNow}: {from}%</label>
          <input id="from" type="range" min={5} max={40} value={from} onChange={(e) => setFrom(Number(e.target.value))} className="w-full accent-brand-green" />
          <label className={`${label} mt-3`} htmlFor="to">{dict.moistureTarget}: {to}%</label>
          <input id="to" type="range" min={5} max={25} value={to} onChange={(e) => setTo(Number(e.target.value))} className="w-full accent-brand-green" />
          <p className="mt-2 rounded bg-soft px-3 py-2 text-sm">{dict.removed}: <strong>{result.removedPercent}%</strong></p>
        </div>

        <div>
          <label className={label} htmlFor="tonnes">{dict.volume} ({dict.tonnes})</label>
          <div className="flex gap-2">
            <input id="tonnes" inputMode="decimal" value={tonnes} onChange={(e) => setTonnes(e.target.value)} className={field} />
            <select aria-label={dict.volume} value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="rounded-md border border-line px-2">
              {(["day", "season", "year"] as Period[]).map((p) => (
                <option key={p} value={p}>{dict.period[p]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold">{dict.prices}</span>
            <select aria-label={dict.currency} value={currency} onChange={(e) => pickCurrency(e.target.value as Currency)} className="rounded-md border border-line px-2 py-1 text-sm">
              <option value="EUR">EUR</option>
              <option value="PLN">PLN</option>
            </select>
          </div>
          <div className="space-y-2">
            {FUEL_ORDER.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <label htmlFor={`p-${f}`} className="w-28 text-sm">{dict.fuels[f]}</label>
                <input id={`p-${f}`} inputMode="decimal" value={prices[f]} onChange={(e) => setPrices({ ...prices, [f]: e.target.value })} className={field} />
                <span className="w-24 text-xs text-muted">{currency} {dict.units[f]}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{dict.priceHint}</p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={withVat} onChange={(e) => setWithVat(e.target.checked)} className="accent-brand-green" />
            {dict.vat.replace(/\d+(?:[.,]\d+)?\s?%/, `${Math.round(VAT_RATE[lang] * 100)}%`)}
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-soft p-5" aria-live="polite">
        <h2 className="mb-4 text-xl font-bold">{dict.result}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-2" />
                <th className="py-2 pr-2">{dict.perTonne}</th>
                <th className="py-2 pr-2">{dict.total}</th>
                <th className="py-2">{dict.saving}</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r) => {
                const best = r.fuel === result.cheapest;
                return (
                  <tr key={r.fuel} className={best ? "bg-green-100 font-semibold" : ""}>
                    <td className="py-2 pr-2">
                      {dict.fuels[r.fuel]}
                      {best && <span className="ml-2 rounded bg-brand-green px-2 py-0.5 text-xs text-white">{dict.best}</span>}
                    </td>
                    <td className="py-2 pr-2">{money2.format(r.costPerTonne)}</td>
                    <td className="py-2 pr-2">{money.format(r.totalCost)}</td>
                    <td className="py-2">
                      {r.fuel === "gas" ? "—" : `${money.format(r.savingsVsGas)} (${r.savingsPercent.toFixed(0)}%)`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 rounded-md bg-white p-3 font-semibold">
          {winnerSaves
            ? dict.summary
                .replace("{fuel}", dict.fuels[winner.fuel].toLowerCase())
                .replace("{amount}", money.format(winner.savingsVsGas))
                .replace("{period}", dict.period[period])
            : dict.noSaving}
        </p>

        <figure className="mt-5" aria-label={dict.chart}>
          <figcaption className="mb-2 text-sm font-semibold">{dict.chart}</figcaption>
          <div className="space-y-2">
            {result.results.map((r) => (
              <div key={r.fuel} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0">{dict.fuels[r.fuel]}</span>
                <div className="h-6 flex-1 rounded bg-white">
                  <div
                    className={`h-6 rounded transition-all duration-500 ${r.fuel === result.cheapest ? "bg-brand-green" : "bg-brand-orange"}`}
                    style={{ width: `${(r.costPerTonne / maxCost) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </figure>

        <p className="mt-4 text-xs text-muted">{dict.disclaimer}</p>
        <Link href={`/${lang}/contact${calcSummary ? `?calc=${encodeURIComponent(calcSummary)}` : ""}`} className="mt-4 inline-block rounded-md bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark">
          {dict.cta}
        </Link>
      </div>
    </div>
  );
}
