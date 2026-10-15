import { calculateBatches, paybackPeriods, type Fuel } from "@/lib/calculator";
import { CROPS, CURRENCIES, PERIODS, VAT_RATE, type Crop, type Currency, type Period } from "@/lib/calculator/config";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";

export type ReportInput = {
  currency: Currency;
  withVat: boolean;
  period: Period;
  boilerPrice: number;
  prices: Record<Fuel, number>;
  rows: { crop: Crop; from: number; to: number; tonnes: number }[];
};

const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;

/** Validates untrusted JSON from the browser. Returns null for anything out of range. */
export function parseReportInput(raw: unknown): ReportInput | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!CURRENCIES.includes(r.currency as Currency) || !PERIODS.includes(r.period as Period)) return null;
  const prices = r.prices as Record<string, unknown> | undefined;
  const gas = num(prices?.gas, 0, 1e6), chips = num(prices?.chips, 0, 1e6), pellets = num(prices?.pellets, 0, 1e6);
  const boiler = num(r.boilerPrice ?? 0, 0, 1e9);
  if (gas === null || chips === null || pellets === null || boiler === null) return null;
  if (!Array.isArray(r.rows) || r.rows.length < 1 || r.rows.length > 5) return null;
  const rows: ReportInput["rows"] = [];
  for (const x of r.rows as Record<string, unknown>[]) {
    const from = num(x?.from, 0, 100), to = num(x?.to, 0, 100), tonnes = num(x?.tonnes, 0, 1e7);
    if (!CROPS.includes(x?.crop as Crop) || from === null || to === null || tonnes === null) return null;
    rows.push({ crop: x.crop as Crop, from, to, tonnes });
  }
  return { currency: r.currency as Currency, withVat: r.withVat === true, period: r.period as Period, boilerPrice: boiler, prices: { gas, chips, pellets }, rows };
}

/** Plain-text report in the visitor's language. Everything is recomputed here, never taken from the client. */
export function buildReport(lang: Locale, d: Dictionary["calc"], input: ReportInput, site: { phone: string; email: string }) {
  const result = calculateBatches({
    batches: input.rows.map((r) => ({ moistureFrom: r.from, moistureTo: r.to, tonnes: r.tonnes })),
    prices: input.prices,
    vatRate: input.withVat ? VAT_RATE[lang] : 0,
  });
  const money = new Intl.NumberFormat(lang, { style: "currency", currency: input.currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0, useGrouping: "always" });
  const money2 = new Intl.NumberFormat(lang, { style: "currency", currency: input.currency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
  const winner = result.results.find((r) => r.fuel === result.cheapest);
  const saves = winner && winner.fuel !== "gas" && winner.savingsVsGas > 0;

  const lines: string[] = [d.reportTitle, "=".repeat(d.reportTitle.length), "", `${d.reportInputs}:`];
  for (const r of input.rows) {
    lines.push(`- ${d.crops[r.crop]}: ${r.tonnes} ${d.tonnes} ${d.period[input.period]}, ${d.moistureFromTo.replace("{from}", String(r.from)).replace("{to}", String(r.to))}`);
  }
  lines.push(`- ${d.priceLine} (${input.currency}, ${input.withVat ? d.withVat : d.withoutVat}): ${(["gas", "chips", "pellets"] as Fuel[]).map((f) => `${d.fuels[f]} ${input.prices[f]} ${d.units[f]}`).join("; ")}`);
  lines.push("", `${d.result}:`);
  for (const r of result.results) {
    const save = r.fuel === "gas" ? "" : ` | ${d.saving}: ${money.format(r.savingsVsGas)} (${r.savingsPercent.toFixed(0)}%)`;
    lines.push(`- ${d.fuels[r.fuel]}: ${money2.format(r.costPerTonne)} / t | ${d.total}: ${money.format(r.totalCost)}${save}${r.fuel === result.cheapest ? `  <- ${d.best}` : ""}`);
  }
  let summary = d.noSaving;
  if (saves) {
    summary = d.summary
      .replace("{fuel}", lang === "de" ? d.fuels[winner.fuel] : d.fuels[winner.fuel].toLowerCase())
      .replace("{amount}", money.format(winner.savingsVsGas))
      .replace("{period}", d.period[input.period]);
    const pb = input.period !== "day" && input.boilerPrice > 0 ? paybackPeriods(input.boilerPrice, winner.savingsVsGas) : null;
    lines.push("", summary);
    if (pb !== null) lines.push(`${d.paybackTitle}: ${pb.toFixed(1)} ${d.paybackUnit[input.period === "year" ? "year" : "season"]}`);
  } else lines.push("", summary);
  lines.push("", d.disclaimer, `${d.contactLine}: ${site.phone} · ${site.email}`);

  return { text: lines.join("\n"), summary, savings: saves ? winner.savingsVsGas : 0 };
}
