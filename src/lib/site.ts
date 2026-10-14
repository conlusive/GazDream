import { locales, type Locale } from "@/i18n/config";

export const SITE_NAME = "Eco Straßmayr Energy";

/** Public origin. Set SITE_URL when building (the Docker image takes it as a build argument). */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const PAGES = ["", "/about", "/boilers", "/projects", "/calculator", "/faq", "/contact", "/privacy"] as const;

/** Canonical + hreflang alternates for a path such as "/about". */
export function alternatesFor(lang: Locale, path: string) {
  return {
    canonical: `/${lang}${path}`,
    languages: { ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])), "x-default": `/pl${path}` },
  };
}
