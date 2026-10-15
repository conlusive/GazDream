// Languages shown to the public (language switcher, sitemap, hreflang, search engines).
export const publicLocales = ["pl", "en", "de"] as const;
// "uk" is a hidden review language for the customer: reachable at /uk, never advertised, not indexed.
export const locales = [...publicLocales, "uk"] as const;
export type Locale = (typeof locales)[number];
export type PublicLocale = (typeof publicLocales)[number];
export const defaultLocale: PublicLocale = "pl";
export const HIDDEN_LOCALES: readonly Locale[] = ["uk"];
export const LOCALE_COOKIE = "gd_lang";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const isHidden = (lang: Locale) => HIDDEN_LOCALES.includes(lang);
// Ukrainian review version uses the Polish market settings (PLN, 23% VAT).
export const usesPolishMarket = (lang: Locale) => lang === "pl" || lang === "uk";
