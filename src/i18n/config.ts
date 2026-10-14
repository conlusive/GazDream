export const locales = ["pl", "en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pl";
export const LOCALE_COOKIE = "gd_lang";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);
