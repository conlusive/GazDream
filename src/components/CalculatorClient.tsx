"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";
import CumulativeChart from "@/components/CumulativeChart";
import Select from "@/components/Select";
import Logo from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { breakEvenPrice, calculateBatches, paybackPeriods, type Fuel } from "@/lib/calculator";
import { CONTACT } from "@/lib/content";
import { TONNES_KEY } from "@/components/HeroCard";
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
const PRESETS = [500, 1000, 5000, 10000, 20000];

// Negative or garbage input is treated as 0 so the calculation never throws.
const num = (v: string) => Math.max(0, Number(v.replace(",", ".")) || 0);
const newRow = (id: number, crop: Crop): Row => ({ id, crop, from: CROP_START[crop], to: CROP_TARGET[crop], tonnes: "1000" });

// Volume slider is logarithmic (10 t .. 100 000 t) so both a small farm and an elevator fit on one control.
const T_MIN = 10;
const T_MAX = 100_000;
const tonnesToSlider = (t: number) => Math.round((1000 * Math.log(Math.max(t, T_MIN) / T_MIN)) / Math.log(T_MAX / T_MIN));
const niceRound = (x: number) => {
  const step = x < 100 ? 10 : x < 1000 ? 50 : x < 10000 ? 100 : 1000;
  return Math.round(x / step) * step;
};
const sliderToTonnes = (v: number) => niceRound(T_MIN * Math.pow(T_MAX / T_MIN, v / 1000));

function CropIcon({ crop }: { crop: Crop }) {
  const common = { viewBox: "0 0 40 40", className: "h-9 w-9", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (crop === "corn")
    return (
      <svg {...common}>
        <path d="M20 5c5 3 7 9 7 15 0 7-3 12-7 15-4-3-7-8-7-15 0-6 2-12 7-15z" />
        <path d="M20 8v24M15 14h10M14 20h12M15 26h10" />
        <path d="M13 36c-4-1-7-5-8-10M27 36c4-1 7-5 8-10" />
      </svg>
    );
  if (crop === "soy")
    return (
      <svg {...common}>
        <path d="M8 29C6 18 14 8 28 7c1 12-7 22-20 22z" />
        <circle cx="15" cy="22" r="2" />
        <circle cx="21" cy="17" r="2" />
        <circle cx="26" cy="12" r="1.5" />
        <path d="M8 29l-3 6" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="20" cy="20" r="3" />
      <path d="M20 17c-4-3-4-9 0-12 4 3 4 9 0 12zM23 20c3-4 9-4 12 0-3 4-9 4-12 0zM20 23c4 3 4 9 0 12-4-3-4-9 0-12zM17 20c-3 4-9 4-12 0 3-4 9-4 12 0z" />
    </svg>
  );
}

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

  // Carry over the volume picked in the home-page card, once.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TONNES_KEY);
      if (!saved) return;
      sessionStorage.removeItem(TONNES_KEY);
      const t = Number(saved);
      // Reading browser storage is only possible after mount (the server render must stay identical).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Number.isFinite(t) && t > 0) setRows((rs) => rs.map((r, i) => (i === 0 ? { ...r, tonnes: String(Math.round(t)) } : r)));
    } catch {
      /* storage unavailable: keep defaults */
    }
  }, []);

  const market = defaultPrices[currency];
  const money = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency, maximumFractionDigits: 0, useGrouping: "always" }),
    [lang, currency],
  );
  const money2 = useMemo(
    () => new Intl.NumberFormat(lang, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" }),
    [lang, currency],
  );
  const vatLabel = dict.vat.replace(/\d+(?:[.,]\d+)?\s?%/, `${Math.round(VAT_RATE[lang] * 100)}%`);

  const priceNums = useMemo(() => ({ gas: num(prices.gas), chips: num(prices.chips), pellets: num(prices.pellets) }), [prices]);
  const result = useMemo(
    () =>
      calculateBatches({
        batches: rows.map((r) => ({ moistureFrom: r.from, moistureTo: r.to, tonnes: num(r.tonnes) })),
        prices: priceNums,
        vatRate: withVat ? VAT_RATE[lang] : 0,
      }),
    [rows, priceNums, withVat, lang],
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
  const setPrice = (fuel: Fuel, value: number) => setPrices((p) => ({ ...p, [fuel]: String(Math.max(0, value)) }));
  const printReport = () => {
    setPrintedAt(new Date().toLocaleDateString(lang));
    setTimeout(() => window.print(), 50);
  };

  const maxCost = Math.max(...result.results.map((r) => r.costPerTonne), 0.0001);
  const winner = result.results.find((r) => r.fuel === result.cheapest);
  const winnerSaves = winner && winner.fuel !== "gas" && winner.savingsVsGas > 0;
  const periodOk = period !== "day";
  const boilerNum = num(boilerPrice);
  const wantsPayback = boilerNum > 0;
  const payback = winnerSaves && periodOk ? paybackPeriods(boilerNum, winner.savingsVsGas) : null;
  const unitKey = period === "year" ? "year" : "season";
  const paybackText = !wantsPayback
    ? ""
    : !periodOk
      ? dict.paybackNeedPeriod
      : payback === null
        ? dict.paybackNever
        : `${dict.paybackTitle}: ${payback.toLocaleString(lang, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} ${dict.paybackUnit[unitKey]}`;
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
  const rowsLabel = rows.map((r) => `${dict.crops[r.crop]} ${num(r.tonnes)} ${dict.tonnes}`).join(", ");
  const calcSummary = winnerSaves
    ? `${rowsLabel} ${dict.period[period]}, ${dict.fuels[winner.fuel]}: ${money.format(winner.savingsVsGas)}`
    : "";

  const label = "mb-2 flex items-center justify-between gap-3 text-sm font-bold";
  const pill = "tabular rounded-full bg-tint px-3 py-0.5 text-sm font-extrabold text-brand-green";

  return (
    <>
      <div className="grid grid-cols-1 gap-8 print:hidden lg:grid-cols-[1.05fr_1fr] lg:items-start">
        {/* ---------- inputs ---------- */}
        <div className="min-w-0 space-y-6">
          {rows.map((row, index) => {
            const removed = Math.max(0, row.from - row.to);
            const scale = 40;
            return (
              <fieldset key={row.id} className="card space-y-8 p-6 sm:p-8">
                <legend className="sr-only">{rows.length > 1 ? `${dict.batch} ${index + 1}: ` : ""}{dict.stepCrop}</legend>

                <Step n={1} title={`${rows.length > 1 ? `${dict.batch} ${index + 1} · ` : ""}${dict.stepCrop}`} action={
                  rows.length > 1 ? (
                    <button type="button" onClick={() => setRows(rows.filter((r) => r.id !== row.id))} className="text-sm font-bold text-red-700 hover:underline">
                      {dict.remove}
                    </button>
                  ) : null
                }>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(CROP_TARGET) as Crop[]).map((c) => {
                      const on = row.crop === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => pickCrop(row.id, c)}
                          aria-pressed={on}
                          className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-4 text-sm font-bold transition duration-300 ease-out-soft active:scale-[0.97] ${
                            on ? "border-brand-green bg-tint text-brand-green" : "border-line text-muted hover:-translate-y-0.5 hover:border-brand-green/50 hover:text-ink"
                          }`}
                        >
                          <CropIcon crop={c} />
                          {dict.crops[c]}
                        </button>
                      );
                    })}
                  </div>
                </Step>

                <Step n={2} title={dict.stepMoisture}>
                  {/* Visual scale: the coloured segment is the moisture that has to be removed. */}
                  <div className="mb-5" aria-hidden="true">
                    <div className="relative h-3 rounded-full bg-line">
                      <div
                        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-brand-green to-brand-orange transition-all duration-500 ease-out-soft"
                        style={{ left: `${(Math.min(row.to, row.from) / scale) * 100}%`, width: `${(removed / scale) * 100}%` }}
                      />
                      <span className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-brand-green shadow transition-all duration-500 ease-out-soft" style={{ left: `${(row.to / scale) * 100}%` }} />
                      <span className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-brand-orange shadow transition-all duration-500 ease-out-soft" style={{ left: `${(row.from / scale) * 100}%` }} />
                    </div>
                    <div className="tabular mt-2 flex justify-between text-xs text-muted"><span>0%</span><span>{scale}%</span></div>
                  </div>
                  <label className={label} htmlFor={`from-${row.id}`}><span>{dict.moistureNow}</span><span className={pill}>{row.from}%</span></label>
                  <input id={`from-${row.id}`} type="range" min={5} max={scale} value={row.from} onChange={(e) => updateRow(row.id, { from: Number(e.target.value) })} className="w-full" />
                  <label className={`${label} mt-5`} htmlFor={`to-${row.id}`}><span>{dict.moistureTarget}</span><span className={pill}>{row.to}%</span></label>
                  <input id={`to-${row.id}`} type="range" min={5} max={25} value={row.to} onChange={(e) => updateRow(row.id, { to: Number(e.target.value) })} className="w-full" />
                  <p className="mt-4 flex items-center justify-between rounded-xl bg-soft px-4 py-3 text-sm">
                    <span className="text-muted">{dict.removed}</span>
                    <strong className="tabular text-base">{removed}%</strong>
                  </p>
                </Step>

                <Step n={3} title={`${dict.stepVolume} (${dict.tonnes})`}>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={dict.quick}>
                    {PRESETS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateRow(row.id, { tonnes: String(t) })}
                        aria-pressed={num(row.tonnes) === t}
                        className={`tabular min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition duration-200 ${
                          num(row.tonnes) === t ? "border-brand-green bg-brand-green text-white" : "border-line hover:border-brand-green/60 hover:bg-tint"
                        }`}
                      >
                        {t.toLocaleString(lang)}
                      </button>
                    ))}
                  </div>
                  <input
                    id={`t-${row.id}`}
                    inputMode="decimal"
                    aria-label={`${dict.stepVolume} (${dict.tonnes})`}
                    value={row.tonnes}
                    onChange={(e) => updateRow(row.id, { tonnes: e.target.value })}
                    className="field mt-4"
                  />
                  <input
                    type="range"
                    min={0}
                    max={1000}
                    value={tonnesToSlider(num(row.tonnes))}
                    onChange={(e) => updateRow(row.id, { tonnes: String(sliderToTonnes(Number(e.target.value))) })}
                    aria-label={dict.stepVolume}
                    className="mt-4 w-full"
                  />
                </Step>
              </fieldset>
            );
          })}

          {rows.length < MAX_ROWS && (
            <button type="button" onClick={addRow} className="w-full rounded-2xl border-2 border-dashed border-brand-green/50 px-4 py-4 text-sm font-bold text-brand-green transition duration-300 hover:border-brand-green hover:bg-tint">
              + {dict.addCrop}
            </button>
          )}

          <div className="card space-y-8 p-6 sm:p-8">
            <div>
              <span className="mb-2 block text-sm font-bold">{dict.periodLabel}</span>
              <Select label={dict.periodLabel} value={period} onChange={(v) => setPeriod(v as Period)} options={(["day", "season", "year"] as Period[]).map((p) => ({ value: p, label: dict.period[p] }))} />
              {rows.length > 1 && (
                <p className="mt-2 text-sm text-muted">{dict.totalVolume}: <strong className="tabular">{result.totalTonnes} {dict.tonnes}</strong></p>
              )}
            </div>

            <Step n={4} title={dict.stepPrices} action={
              <Select compact label={dict.currency} value={currency} onChange={(v) => pickCurrency(v as Currency)} options={[{ value: "EUR", label: "EUR" }, { value: "PLN", label: "PLN" }]} className="w-24" />
            }>
              <div className="space-y-6">
                {FUEL_ORDER.map((f) => {
                  const value = priceNums[f];
                  const base = market[f];
                  const off = Math.abs(value - base) > 0.0001;
                  const step = Math.max(1, Math.round(base / 100));
                  return (
                    <div key={f}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label htmlFor={`p-${f}`} className="text-sm font-bold">{dict.fuels[f]} <span className="font-normal text-muted">· {currency} {dict.units[f]}</span></label>
                        {off && (
                          <button type="button" onClick={() => setPrice(f, base)} className="py-2 text-xs font-bold text-brand-green hover:underline">
                            {dict.reset}: {base}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label="−" onClick={() => setPrice(f, value - step)} className="h-11 w-11 shrink-0 rounded-xl border border-line text-xl font-bold transition hover:border-brand-green hover:bg-tint active:scale-95">−</button>
                        <input id={`p-${f}`} inputMode="decimal" value={prices[f]} onChange={(e) => setPrices({ ...prices, [f]: e.target.value })} className="field text-center font-bold" />
                        <button type="button" aria-label="+" onClick={() => setPrice(f, value + step)} className="h-11 w-11 shrink-0 rounded-xl border border-line text-xl font-bold transition hover:border-brand-green hover:bg-tint active:scale-95">+</button>
                      </div>
                      <input
                        type="range"
                        min={Math.round(base * 0.3)}
                        max={Math.round(base * 2.5)}
                        step={step}
                        value={Math.min(Math.max(value, base * 0.3), base * 2.5)}
                        onChange={(e) => setPrice(f, Number(e.target.value))}
                        aria-label={dict.fuels[f]}
                        className="mt-3 w-full"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted">{dict.priceHint}</p>
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input type="checkbox" checked={withVat} onChange={(e) => setWithVat(e.target.checked)} className="h-4 w-4 accent-brand-green" />
                {vatLabel}
              </label>
              <p className="mt-2 text-xs text-muted">{dict.pricesAsOf.replace("{date}", priceDate)}</p>
            </Step>

            <div>
              <label className="mb-2 block text-sm font-bold" htmlFor="boiler">{dict.stepBoiler}: {currency}</label>
              <input id="boiler" inputMode="decimal" value={boilerPrice} onChange={(e) => setBoilerPrice(e.target.value)} className="field" />
            </div>
          </div>
        </div>

        {/* ---------- results ---------- */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:z-10 lg:self-start">
          <div className="rounded-3xl bg-forest p-6 text-white sm:p-9">
            <p className="sr-only" aria-live="polite">{summary} {paybackText}</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-leaf">{dict.result}</p>
            <p className="tabular mt-4 min-h-[6.5rem] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{renderSummary("text-brand-orange")}</p>
            {paybackText && <p className="mt-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm font-bold">{paybackText}</p>}
            <dl className="tabular mt-6 grid grid-cols-3 gap-3 border-t border-white/15 pt-5 text-sm">
              {result.results.map((r) => (
                <div key={r.fuel}>
                  <dt className="text-white/60">{dict.fuels[r.fuel]}</dt>
                  <dd className={`mt-1 text-lg font-extrabold ${r.fuel === result.cheapest ? "text-leaf" : ""}`}><AnimatedNumber value={r.costPerTonne} format={money2.format} /></dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={`/${lang}/contact${calcSummary ? `?calc=${encodeURIComponent(calcSummary)}` : ""}`}>{dict.cta}</ButtonLink>
              <button type="button" onClick={printReport} className="btn btn-light">{dict.pdf}</button>
            </div>
            <p className="mt-4 text-xs text-white/55">{dict.disclaimer} {dict.pdfHint}</p>
          </div>
        </div>
      </div>

      {/* ---------- details: full width, below the inputs and the sticky summary ---------- */}
      <div className="mt-10 space-y-6 print:hidden">
          <div className="card p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{dict.fuelCards}</h2>
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {result.results.map((r) => {
                const best = r.fuel === result.cheapest;
                return (
                  <li key={r.fuel} className={`rounded-2xl border-2 p-4 transition-colors duration-300 ${best ? "border-brand-green bg-tint" : "border-line"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-extrabold">{dict.fuels[r.fuel]}</span>
                      {best && <span className="rounded-full bg-brand-green px-3 py-0.5 text-xs font-bold text-white">{dict.best}</span>}
                    </div>
                    <p className="tabular mt-2 text-3xl font-extrabold tracking-tight">
                      <AnimatedNumber value={r.costPerTonne} format={money2.format} />
                      <span className="ml-1 text-sm font-semibold text-muted">/ t</span>
                    </p>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/10">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out-soft ${best ? "bg-brand-green" : r.fuel === "gas" ? "bg-brand-orange" : "bg-ink/40"}`}
                        style={{ width: `${(r.costPerTonne / maxCost) * 100}%` }}
                      />
                    </div>
                    <dl className="tabular mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <dt className="text-muted">{dict.total}</dt><dd className="text-right font-bold"><AnimatedNumber value={r.totalCost} format={money.format} /></dd>
                      {r.fuel !== "gas" && (
                        <>
                          <dt className="text-muted">{dict.saving}</dt>
                          <dd className={`text-right font-bold ${r.savingsVsGas > 0 ? "text-brand-green" : "text-red-700"}`}><Savings r={r} money={money} /></dd>
                        </>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>
            <details className="mt-5">
              <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-brand-green hover:underline">{dict.details}</summary>
              <div className="mt-3 overflow-x-auto">
                <ResultTable result={result} dict={dict} money={money} money2={money2} />
              </div>
            </details>
          </div>


        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{dict.breakTitle}</h2>
            <p className="mt-1 text-sm text-muted">{dict.breakHint}</p>
            <div className="mt-5 space-y-5">
              {(["chips", "pellets"] as const).map((f) => {
                const be = breakEvenPrice(f, priceNums.gas);
                if (be === null) return null;
                const now = priceNums[f];
                const max = Math.max(be, now) * 1.15;
                const cheaper = now < be;
                return (
                  <div key={f}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-bold">{dict.fuels[f]}</span>
                      <span className="tabular text-sm text-muted">
                        {dict.breakNow}: <strong className={cheaper ? "text-brand-green" : "text-red-700"}>{money.format(now)}</strong> · {dict.breakTitle}: <strong className="text-ink">{money.format(be)}</strong>
                      </span>
                    </div>
                    <div className="relative mt-3 h-3 rounded-full bg-line" aria-hidden="true">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-brand-green/25" style={{ width: `${(be / max) * 100}%` }} />
                      <div className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out-soft ${cheaper ? "bg-brand-green" : "bg-red-600"}`} style={{ width: `${Math.min(100, (now / max) * 100)}%` }} />
                      <span className="absolute -top-1.5 h-6 w-0.5 bg-brand-orange" style={{ left: `${(be / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          <div className="card p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{dict.chartTitle}</h2>
            {winnerSaves && periodOk ? (
              <CumulativeChart
                perPeriod={winner.savingsVsGas}
                boilerPrice={boilerNum}
                formatMoney={money.format}
                labels={{
                  after: dict.chartAfter,
                  unit: period === "year" ? dict.unitYears : dict.unitSeasons,
                  boiler: dict.chartBoiler,
                  payback: dict.chartPayback,
                }}
              />
            ) : (
              <p className="mt-4 rounded-xl bg-soft p-4 text-sm text-muted">{periodOk ? dict.noSaving : dict.chartDay}</p>
            )}
          </div>

        </div>
      </div>

      {/* Printed report: hidden on screen, this is what "Save as PDF" captures. */}
      <section className="hidden text-sm print:block">
        <Logo className="h-20 w-auto" />
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
        <p className="mt-4 text-base font-bold">{renderSummary("text-brand-green")}</p>
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

function Step({ n, title, action, children }: { n: number; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-base font-extrabold">
          <span className="tabular flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">{n}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

type SharedProps = {
  result: ReturnType<typeof calculateBatches>;
  dict: Dictionary["calc"];
};

function ResultTable({ result, dict, money, money2 }: SharedProps & { money: Intl.NumberFormat; money2: Intl.NumberFormat }) {
  return (
    <table className="tabular w-full text-left text-sm">
      <thead className="text-muted">
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
          return (
            <tr key={r.fuel} className={`border-t border-line ${best ? "bg-tint font-bold" : ""}`}>
              <td className="py-3 pr-3">{dict.fuels[r.fuel]}</td>
              <td className="py-3 pr-3"><AnimatedNumber value={r.costPerTonne} format={money2.format} /></td>
              <td className="py-3 pr-3"><AnimatedNumber value={r.totalCost} format={money.format} /></td>
              <td className="py-3">{r.fuel === "gas" ? "—" : <Savings r={r} money={money} />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Bars({ result, dict, maxCost }: SharedProps & { maxCost: number }) {
  return (
    <div className="space-y-3">
      {result.results.map((r) => (
        <div key={r.fuel} className="flex items-center gap-3 text-xs">
          <span className="w-24 shrink-0 font-semibold">{dict.fuels[r.fuel]}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-soft print:border print:border-line">
            <div
              className={`h-3 rounded-full print:[print-color-adjust:exact] ${r.fuel === result.cheapest ? "bg-brand-green" : "bg-ink/30"}`}
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
