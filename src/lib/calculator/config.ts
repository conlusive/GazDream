import type { Locale } from "@/i18n/config";

export type Crop = "corn" | "soy" | "rapeseed";
export type Currency = "EUR" | "PLN";
export type Period = "day" | "season" | "year";

export const VAT_RATE: Record<Locale, number> = { pl: 0.23, de: 0.19, en: 0.2 };
export const CROPS: Crop[] = ["corn", "soy", "rapeseed"];
export const CURRENCIES: Currency[] = ["EUR", "PLN"];
export const PERIODS: Period[] = ["day", "season", "year"];
