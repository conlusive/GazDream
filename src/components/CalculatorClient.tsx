"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";
import { calculateBatches, paybackPeriods, type Fuel } from "@/lib/calculator";
import { CONTACT } from "@/lib/content";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";

type Crop = "corn" | "soy" | "rapeseed";
type Currency = "EUR" | "PLN";
type PriceTable = Record<Currency, Record<Fuel, number>>;
type Period = "day" | "season" | "year";
type Row = { id: number; crop: Crop; from: number; to: number; tonnes: string };

const CROP_TARGET: Record<Crop, number> = { corn: 14, soy: 13, rapeseed: 8 };
const CROP_START: Record<Crop, number> = { corn: 20, soy: 18, rapeseed: 12 };
const MAX_ROWS = 5;
const VAT_RATE: Record<Locale, number> = { pl: 0.23, de: 0.19, en: 0.2 };
const FUEL_ORDER: Fuel[] = ["gas", "chips", "pellets"];

// Negative or garbage input is treated as 0 so the calculation never throws.
const num = (v: string) => Math.max(0, Number(v.replace(",", ".")) || 0);
const newRow = (id: number, crop: Crop): Row => ({ id, crop, from: CROP_START[crop], to: CROP_TARGET[crop], tonnes: "1000" });

type Props = { lang: Locale; dict: Dictionary["calc"]; defaultPrices: PriceTable; pricesDate: string };

export default function CalculatorClient({ lang, dict, defaultPrices, pricesDate }: Props) {
  const [currency, setCurrency] = useState<Currency>(lang === "pl" ? "PLN" : "EUR");
  const [rows, setRows] = useState<Row[]>([newRow(1, "corn")]);
  const [nextId, setNextId] = useState(2);
  const [period, setPeriod] = useState<Period>("season");
  const [prices, setPrices] = useState<Record<Fuel, string>>(() => {
    const p = defaultPrices[lang === "pl" ? "PLN" : "EUR"];
    return { gas: String(p.gas), chips: String(p.chips), pellets: String(p.pellets) };
  });
  const [withVat, setWithVat] = useState(false);
  const [boilerPrice, setBoilerPrice] = useState("");
  const [printedAt, setPrintedAt] = useState("");

  const money = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency, maximumFractionDigits: 0, useGrouping: "always" }),
    [lang, currency],
  );
  const money2 = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }),
    [lang, currency],
  );
  const vatLabel = dict.vat.replace(/\d+(?:[.,]\d+)?\s?%/, `${Math.round(VAT_RATE[lang] * 100)}%`);

  const result = useMemo(
    () =>
      calculateBatches({
        batches: rows.map((r) => ({ moistureFrom: r.from, moistureTo: r.to, tonnes: num(r.tonnes) })),
        prices: { gas: num(prices.gas), chips: num(prices.chips), pellets: num(prices.pellets) },
        vatRate: withVat ? VAT_RATE[lang] : 0,
      }),
    [rows, prices, withVat, lang],
  );

  const updateRow = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const pickCrop = (id: number, crop: Crop) => updateRow(id, { crop, from: CROP_START[crop], to: CROP_TARGET[crop] });
  const addRow = () => {
    if (rows.length >= MAX_ROWS) return;
    const used = new Set(rows.map((r) => r.crop));
    const crop = (Object.keys(CROP_TARGET) as Crop[]).find((c) => !used.has(c)) ?? "corn";
    setRows([...rows, newRow(nextId, crop)]);
    setNextId(nextId + 1);
  };
  const pickCurrency = (c: Currency) => {
    setCurrency(c);
    const p = defaultPrices[c];
    setPrices({ gas: String(p.gas), chips: String(p.chips), pellets: String(p.pellets) });
  };
  const printReport = () => {
    setPrintedAt(new Date().toLocaleDateString(lang));
    setTimeout(() => window.print(), 50);
  };

  const maxCost = Math.max(...result.results.map((r) => r.costPerTonne), 0.0001);
  const winner = result.results.find((r) => r.fuel === result.cheapest);
  const winnerSaves = winner && winner.fuel !== "gas" && winner.savingsVsGas > 0;
  const wantsPayback = num(boilerPrice) > 0;
  const periodOk = period !== "day";
  const payback =
    winnerSaves && periodOk ? paybackPeriods(num(boilerPrice), winner.savingsVsGas) : null;
  const paybackText = !wantsPayback
    ? ""
    : !periodOk
      ? dict.paybackNeedPeriod
      : payback === null
        ? dict.paybackNever
        : `${dict.paybackTitle}: ${payback.toLocaleString(lang, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} ${dict.paybackUnit[period]}`;
  const priceDate = new Date(`${pricesDate}T00:00:00Z`).toLocaleDateString(lang, { timeZone: "UTC" });
  const summaryTemplate = winnerSaves
    ? dict.summary
        .replace("{fuel}", lang === "de" ? dict.fuels[winner.fuel] : dict.fuels[winner.fuel].toLowerCase())
        .replace("{period}", dict.period[period])
    : dict.noSaving;
  const summary = summaryTemplate.replace("{amount}", winnerSaves ? money.format(winner.savingsVsGas) : "");
  const [summaryBefore, summaryAfter] = summaryTemplate.split("{amount}");
  const summaryNode =
    winnerSaves && summaryAfter !== undefined ? (
      <>
        {summaryBefore}
        <AnimatedNumber value={winner.savingsVsGas} format={money.format} />
        {summaryAfter}
      </>
    ) : (
      summary
    );
  const rowsLabel = rows.map((r) => `${dict.crops[r.crop]} ${num(r.tonnes)} ${dict.tonnes}`).join(", ");
  const calcSummary = winnerSaves
    ? `${rowsLabel} ${dict.period[period]}, ${dict.fuels[winner.fuel]}: ${money.format(winner.savingsVsGas)}`
    : "";

  const field = "w-full min-w-0 rounded-md border border-line px-3 py-2 text-base focus:border-brand-green focus:outline-none";
  const label = "mb-1 block text-sm font-semibold";

  return (
    <>
      <div className="grid grid-cols-1 gap-8 print:hidden lg:grid-cols-2">
        <div className="min-w-0 space-y-6">
          {rows.map((row, index) => {
            const removed = Math.max(0, row.from - row.to);
            return (
              <fieldset key={row.id} className="space-y-3 rounded-xl border border-line p-4">
                <legend className="px-1 text-sm font-semibold">
                  {rows.length > 1 ? `${dict.batch} ${index + 1}: ` : ""}{dict.crop}
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CROP_TARGET) as Crop[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCrop(row.id, c)}
                      aria-pressed={row.crop === c}
                      className={`rounded-lg border-2 px-2 py-3 text-sm font-semibold ${
                        row.crop === c ? "border-brand-green bg-brand-green text-white" : "border-line hover:border-brand-green"
                      }`}
                    >
                      {dict.crops[c]}
                    </button>
                  ))}
                </div>
                <div>
                  <label className={label} htmlFor={`from-${row.id}`}>{dict.moistureNow}: {row.from}%</label>
                  <input id={`from-${row.id}`} type="range" min={5} max={40} value={row.from} onChange={(e) => updateRow(row.id, { from: Number(e.target.value) })} className="w-full accent-brand-green" />
                  <label className={`${label} mt-2`} htmlFor={`to-${row.id}`}>{dict.moistureTarget}: {row.to}%</label>
                  <input id={`to-${row.id}`} type="range" min={5} max={25} value={row.to} onChange={(e) => updateRow(row.id, { to: Number(e.target.value) })} className="w-full accent-brand-green" />
                  <p className="mt-2 rounded bg-soft px-3 py-2 text-sm">{dict.removed}: <strong>{removed}%</strong></p>
                </div>
                <div>
                  <label className={label} htmlFor={`t-${row.id}`}>{dict.volume} ({dict.tonnes})</label>
                  <input id={`t-${row.id}`} inputMode="decimal" value={row.tonnes} onChange={(e) => updateRow(row.id, { tonnes: e.target.value })} className={field} />
                </div>
                {rows.length > 1 && (
                  <button type="button" onClick={() => setRows(rows.filter((r) => r.id !== row.id))} className="text-sm font-semibold text-red-700 hover:underline">
                    {dict.remove}
                  </button>
                )}
              </fieldset>
            );
          })}

          {rows.length < MAX_ROWS && (
            <button type="button" onClick={addRow} className="rounded-md border-2 border-dashed border-brand-green px-4 py-2 text-sm font-semibold text-brand-green hover:bg-soft">
              + {dict.addCrop}
            </button>
          )}

          <div>
            <label className={label} htmlFor="period">{dict.periodLabel}</label>
            <select id="period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-full rounded-md border border-line px-3 py-2">
              {(["day", "season", "year"] as Period[]).map((p) => (
                <option key={p} value={p}>{dict.period[p]}</option>
              ))}
            </select>
            {rows.length > 1 && (
              <p className="mt-2 text-sm text-muted">{dict.totalVolume}: <strong>{result.totalTonnes} {dict.tonnes}</strong></p>
            )}
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
                  <label htmlFor={`p-${f}`} className="w-24 shrink-0 text-sm">{dict.fuels[f]}</label>
                  <input id={`p-${f}`} inputMode="decimal" value={prices[f]} onChange={(e) => setPrices({ ...prices, [f]: e.target.value })} className={field} />
                  <span className="w-20 shrink-0 text-xs text-muted">{currency} {dict.units[f]}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">{dict.priceHint}</p>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={withVat} onChange={(e) => setWithVat(e.target.checked)} className="accent-brand-green" />
              {vatLabel}
            </label>
            <p className="mt-2 text-xs text-muted">{dict.pricesAsOf.replace("{date}", priceDate)}</p>
          </div>

          <div>
            <label className={label} htmlFor="boiler">{dict.boilerPrice}: {currency}</label>
            <input id="boiler" inputMode="decimal" value={boilerPrice} onChange={(e) => setBoilerPrice(e.target.value)} className={field} />
          </div>
        </div>

        <div className="min-w-0 self-start rounded-xl border border-line bg-soft p-5 lg:sticky lg:top-24">
          <p className="sr-only" aria-live="polite">{summary} {paybackText}</p>
          <h2 className="mb-4 text-xl font-bold">{dict.result}</h2>
          <ul className="space-y-2 sm:hidden">
            {result.results.map((r) => {
              const best = r.fuel === result.cheapest;
              return (
                <li key={r.fuel} className={`rounded-lg border p-3 ${best ? "border-brand-green bg-green-100" : "border-line bg-white"}`}>
                  <div className="flex items-center justify-between font-semibold">
                    <span>{dict.fuels[r.fuel]}</span>
                    {best && <span className="rounded bg-brand-green px-2 py-0.5 text-xs text-white">{dict.best}</span>}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted">{dict.perTonne}</dt><dd className="text-right font-semibold"><AnimatedNumber value={r.costPerTonne} format={money2.format} /></dd>
                    <dt className="text-muted">{dict.total}</dt><dd className="text-right font-semibold"><AnimatedNumber value={r.totalCost} format={money.format} /></dd>
                    {r.fuel !== "gas" && (
                      <>
                        <dt className="text-muted">{dict.saving}</dt>
                        <dd className="text-right font-semibold"><Savings r={r} money={money} /></dd>
                      </>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <ResultTable result={result} dict={dict} money={money} money2={money2} />
          </div>

          <p className="mt-4 rounded-md bg-white p-3 font-semibold">{summaryNode}</p>
          {paybackText && <p className="mt-2 rounded-md bg-white p-3 font-semibold">{paybackText}</p>}

          <figure className="mt-5" aria-label={dict.chart}>
            <figcaption className="mb-2 text-sm font-semibold">{dict.chart}</figcaption>
            <Bars result={result} dict={dict} maxCost={maxCost} />
          </figure>

          <p className="mt-4 text-xs text-muted">{dict.disclaimer}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/contact${calcSummary ? `?calc=${encodeURIComponent(calcSummary)}` : ""}`}
              className="rounded-md bg-brand-orange px-6 py-3 font-semibold text-white hover:bg-brand-orange-dark"
            >
              {dict.cta}
            </Link>
            <button type="button" onClick={printReport} className="rounded-md border-2 border-brand-green px-6 py-3 font-semibold text-brand-green hover:bg-white">
              {dict.pdf}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{dict.pdfHint}</p>
        </div>
      </div>

      {/* Printed report: hidden on screen, this is what "Save as PDF" captures. */}
      <section className="hidden text-sm print:block">
        <Image src="/brand/logo.jpg" alt="" width={140} height={70} />
        <h1 className="mt-4 text-2xl font-bold">{dict.reportTitle}</h1>
        <p className="text-muted">{dict.reportDate}: {printedAt}</p>

        <h2 className="mb-1 mt-5 text-base font-bold">{dict.reportInputs}</h2>
        <ul className="list-disc pl-5">
          {rows.map((r) => (
            <li key={r.id}>
              {dict.crops[r.crop]}: {num(r.tonnes)} {dict.tonnes} {dict.period[period]},{" "}
              {dict.moistureFromTo.replace("{from}", String(r.from)).replace("{to}", String(r.to))}
            </li>
          ))}
          <li>
            {dict.priceLine} ({currency}, {withVat ? dict.withVat : dict.withoutVat}):{" "}
            {FUEL_ORDER.map((f) => `${dict.fuels[f]} ${prices[f]} ${dict.units[f]}`).join("; ")}
          </li>
        </ul>

        <h2 className="mb-1 mt-5 text-base font-bold">{dict.result}</h2>
        <ResultTable result={result} dict={dict} money={money} money2={money2} />
        <p className="mt-4 text-base font-bold">{summaryNode}</p>
        {paybackText && <p className="mt-1 text-base font-bold">{paybackText}</p>}
        <div className="mt-4 max-w-md">
          <Bars result={result} dict={dict} maxCost={maxCost} />
        </div>
        <p className="mt-6 text-xs">{dict.disclaimer}</p>
        <p className="mt-2 text-xs">{dict.contactLine}: {CONTACT.phone} · {CONTACT.email}</p>
      </section>
    </>
  );
}

type SharedProps = {
  result: ReturnType<typeof calculateBatches>;
  dict: Dictionary["calc"];
};

function ResultTable({ result, dict, money, money2 }: SharedProps & { money: Intl.NumberFormat; money2: Intl.NumberFormat }) {
  return (
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
              <td className="py-2 pr-2"><AnimatedNumber value={r.costPerTonne} format={money2.format} /></td>
              <td className="py-2 pr-2"><AnimatedNumber value={r.totalCost} format={money.format} /></td>
              <td className="py-2">{r.fuel === "gas" ? "—" : <Savings r={r} money={money} />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Bars({ result, dict, maxCost }: SharedProps & { maxCost: number }) {
  return (
    <div className="space-y-2">
      {result.results.map((r) => (
        <div key={r.fuel} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0">{dict.fuels[r.fuel]}</span>
          <div className="h-6 flex-1 rounded bg-white print:border print:border-line">
            <div
              className={`h-6 rounded transition-all duration-500 print:[print-color-adjust:exact] ${r.fuel === result.cheapest ? "bg-brand-green" : "bg-brand-orange"}`}
              style={{ width: `${(r.costPerTonne / maxCost) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const pct = (n: number) => n.toFixed(0);

function Savings({ r, money }: { r: { savingsVsGas: number; savingsPercent: number }; money: Intl.NumberFormat }) {
  return (
    <>
      <AnimatedNumber value={r.savingsVsGas} format={money.format} /> (
      <AnimatedNumber value={r.savingsPercent} format={pct} />%)
    </>
  );
}
