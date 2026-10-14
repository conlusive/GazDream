"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";
import { ButtonLink } from "@/components/ui/Button";
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
  const renderSummary = (numClass: string) =>
    winnerSaves && summaryAfter !== undefined ? (
      <>
        {summaryBefore}
        <span className={numClass}>
          <AnimatedNumber value={winner.savingsVsGas} format={money.format} />
        </span>
        {summaryAfter}
      </>
    ) : (
      summary
    );
  const summaryDark = renderSummary("text-leaf");
  const summaryLight = renderSummary("text-brand-green");
  const rowsLabel = rows.map((r) => `${dict.crops[r.crop]} ${num(r.tonnes)} ${dict.tonnes}`).join(", ");
  const calcSummary = winnerSaves
    ? `${rowsLabel} ${dict.period[period]}, ${dict.fuels[winner.fuel]}: ${money.format(winner.savingsVsGas)}`
    : "";

  const label = "mb-2 flex items-center justify-between gap-3 text-sm font-bold";
  const pill = "tabular rounded-md bg-soft px-3 py-0.5 text-sm font-bold text-brand-green";

  return (
    <>
      <div className="grid grid-cols-1 gap-8 print:hidden lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <div className="min-w-0 space-y-6">
          {rows.map((row, index) => {
            const removed = Math.max(0, row.from - row.to);
            return (
              <fieldset key={row.id} className="card rise space-y-6 p-6 sm:p-8">
                <legend className="sr-only">{rows.length > 1 ? `${dict.batch} ${index + 1}: ` : ""}{dict.crop}</legend>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{rows.length > 1 ? `${dict.batch} ${index + 1}: ` : ""}{dict.crop}</p>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => setRows(rows.filter((r) => r.id !== row.id))} className="text-sm font-bold text-red-700 transition hover:underline">
                      {dict.remove}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CROP_TARGET) as Crop[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCrop(row.id, c)}
                      aria-pressed={row.crop === c}
                      className={`rounded-md border-2 px-2 py-3.5 text-sm font-bold active:scale-[0.98] ${
                        row.crop === c
                          ? "border-brand-green bg-brand-green text-white"
                          : "border-line hover:border-brand-green/60 hover:bg-soft"
                      }`}
                    >
                      {dict.crops[c]}
                    </button>
                  ))}
                </div>

                <div>
                  <label className={label} htmlFor={`from-${row.id}`}><span>{dict.moistureNow}</span><span className={pill}>{row.from}%</span></label>
                  <input id={`from-${row.id}`} type="range" min={5} max={40} value={row.from} onChange={(e) => updateRow(row.id, { from: Number(e.target.value) })} className="w-full" />
                  <label className={`${label} mt-5`} htmlFor={`to-${row.id}`}><span>{dict.moistureTarget}</span><span className={pill}>{row.to}%</span></label>
                  <input id={`to-${row.id}`} type="range" min={5} max={25} value={row.to} onChange={(e) => updateRow(row.id, { to: Number(e.target.value) })} className="w-full" />
                  <p className="mt-4 flex items-center justify-between rounded-md bg-soft px-4 py-3 text-sm">
                    <span className="text-muted">{dict.removed}</span>
                    <strong className="tabular text-base">{removed}%</strong>
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold" htmlFor={`t-${row.id}`}>{dict.volume} ({dict.tonnes})</label>
                  <input id={`t-${row.id}`} inputMode="decimal" value={row.tonnes} onChange={(e) => updateRow(row.id, { tonnes: e.target.value })} className="field" />
                </div>
              </fieldset>
            );
          })}

          {rows.length < MAX_ROWS && (
            <button type="button" onClick={addRow} className="w-full rounded-lg border-2 border-dashed border-brand-green/50 px-4 py-4 text-sm font-bold text-brand-green hover:border-brand-green hover:bg-white">
              + {dict.addCrop}
            </button>
          )}

          <div className="card space-y-7 p-6 sm:p-8">
            <div>
              <label className="mb-2 block text-sm font-bold" htmlFor="period">{dict.periodLabel}</label>
              <select id="period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="field">
                {(["day", "season", "year"] as Period[]).map((p) => (
                  <option key={p} value={p}>{dict.period[p]}</option>
                ))}
              </select>
              {rows.length > 1 && (
                <p className="mt-2 text-sm text-muted">{dict.totalVolume}: <strong className="tabular">{result.totalTonnes} {dict.tonnes}</strong></p>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold">{dict.prices}</span>
                <select aria-label={dict.currency} value={currency} onChange={(e) => pickCurrency(e.target.value as Currency)} className="rounded-md border border-line bg-white px-3 py-1.5 text-sm font-bold transition hover:border-brand-green/50">
                  <option value="EUR">EUR</option>
                  <option value="PLN">PLN</option>
                </select>
              </div>
              <div className="space-y-3">
                {FUEL_ORDER.map((f) => (
                  <div key={f} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 sm:grid-cols-[7rem_1fr_6rem]">
                    <label htmlFor={`p-${f}`} className="text-sm">{dict.fuels[f]}</label>
                    <input id={`p-${f}`} inputMode="decimal" value={prices[f]} onChange={(e) => setPrices({ ...prices, [f]: e.target.value })} className="field !py-2.5" />
                    <span className="col-start-2 -mt-1.5 text-xs text-muted sm:col-start-auto sm:mt-0">{currency} {dict.units[f]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">{dict.priceHint}</p>
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input type="checkbox" checked={withVat} onChange={(e) => setWithVat(e.target.checked)} className="h-4 w-4 accent-brand-green" />
                {vatLabel}
              </label>
              <p className="mt-2 text-xs text-muted">{dict.pricesAsOf.replace("{date}", priceDate)}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold" htmlFor="boiler">{dict.boilerPrice}: {currency}</label>
              <input id="boiler" inputMode="decimal" value={boilerPrice} onChange={(e) => setBoilerPrice(e.target.value)} className="field" />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-lg bg-forest p-6 text-white sm:p-9 lg:sticky lg:top-24">
          <p className="sr-only" aria-live="polite">{summary} {paybackText}</p>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{dict.result}</p>
          <p className="tabular mt-4 min-h-[6.5rem] text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{summaryDark}</p>
          {paybackText && (
            <p className="mt-4 inline-block rounded-md bg-white/10 px-4 py-2 text-sm font-bold text-white">{paybackText}</p>
          )}

          <div className="mt-8">
            <ul className="space-y-3 sm:hidden">
              {result.results.map((r) => {
                const best = r.fuel === result.cheapest;
                return (
                  <li key={r.fuel} className={`rounded-lg border p-4 transition-colors duration-300 ${best ? "border-leaf/60 bg-white/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>{dict.fuels[r.fuel]}</span>
                      {best && <span className="rounded bg-leaf px-2 py-0.5 text-xs font-semibold text-forest">{dict.best}</span>}
                    </div>
                    <dl className="tabular mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                      <dt className="text-white/60">{dict.perTonne}</dt><dd className="text-right font-bold"><AnimatedNumber value={r.costPerTonne} format={money2.format} /></dd>
                      <dt className="text-white/60">{dict.total}</dt><dd className="text-right font-bold"><AnimatedNumber value={r.totalCost} format={money.format} /></dd>
                      {r.fuel !== "gas" && (
                        <>
                          <dt className="text-white/60">{dict.saving}</dt>
                          <dd className="text-right font-bold text-leaf"><Savings r={r} money={money} /></dd>
                        </>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
              <ResultTable result={result} dict={dict} money={money} money2={money2} tone="dark" />
            </div>
          </div>

          <figure className="mt-8" aria-label={dict.chart}>
            <figcaption className="mb-3 text-sm font-bold text-white/70">{dict.chart}</figcaption>
            <Bars result={result} dict={dict} maxCost={maxCost} tone="dark" />
          </figure>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href={`/${lang}/contact${calcSummary ? `?calc=${encodeURIComponent(calcSummary)}` : ""}`}>{dict.cta}</ButtonLink>
            <button type="button" onClick={printReport} className="btn btn-light">{dict.pdf}</button>
          </div>
          <p className="mt-4 text-xs text-white/55">{dict.disclaimer} {dict.pdfHint}</p>
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
        <ResultTable result={result} dict={dict} money={money} money2={money2} tone="light" />
        <p className="mt-4 text-base font-bold">{summaryLight}</p>
        {paybackText && <p className="mt-1 text-base font-bold">{paybackText}</p>}
        <div className="mt-4 max-w-md">
          <Bars result={result} dict={dict} maxCost={maxCost} tone="light" />
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

type Tone = "dark" | "light";

function ResultTable({ result, dict, money, money2, tone }: SharedProps & { money: Intl.NumberFormat; money2: Intl.NumberFormat; tone: Tone }) {
  const dark = tone === "dark";
  return (
    <table className="tabular w-full text-left text-sm">
      <thead className={dark ? "text-white/55" : "text-muted"}>
        <tr>
          <th className="py-2 pr-3" />
          <th className="py-2 pr-3 font-semibold">{dict.perTonne}</th>
          <th className="py-2 pr-3 font-semibold">{dict.total}</th>
          <th className="py-2 font-semibold">{dict.saving}</th>
        </tr>
      </thead>
      <tbody>
        {result.results.map((r) => {
          const best = r.fuel === result.cheapest;
          const row = dark
            ? `border-t border-white/10 transition-colors duration-300 ${best ? "bg-white/10 font-bold" : ""}`
            : `border-t border-line ${best ? "bg-green-100 font-bold" : ""}`;
          return (
            <tr key={r.fuel} className={row}>
              <td className="py-3 pr-3">
                {dict.fuels[r.fuel]}
                {best && <span className={`ml-2 rounded-md px-2.5 py-0.5 text-xs ${dark ? "bg-leaf text-forest" : "bg-brand-green text-white"}`}>{dict.best}</span>}
              </td>
              <td className="py-3 pr-3"><AnimatedNumber value={r.costPerTonne} format={money2.format} /></td>
              <td className="py-3 pr-3"><AnimatedNumber value={r.totalCost} format={money.format} /></td>
              <td className={`py-3 ${dark ? "text-leaf" : ""}`}>{r.fuel === "gas" ? "—" : <Savings r={r} money={money} />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Bars({ result, dict, maxCost, tone }: SharedProps & { maxCost: number; tone: Tone }) {
  const dark = tone === "dark";
  return (
    <div className="space-y-3">
      {result.results.map((r) => (
        <div key={r.fuel} className="flex items-center gap-3 text-xs">
          <span className={`w-24 shrink-0 font-semibold ${dark ? "text-white/80" : ""}`}>{dict.fuels[r.fuel]}</span>
          <div className={`h-3 flex-1 overflow-hidden rounded-md ${dark ? "bg-white/10" : "bg-soft print:border print:border-line"}`}>
            <div
              className={`h-3 rounded-md transition-[width] duration-700 ease-out-soft print:[print-color-adjust:exact] ${
                r.fuel === result.cheapest ? (dark ? "bg-leaf" : "bg-brand-green") : dark ? "bg-white/35" : "bg-ink/30"
              }`}
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
