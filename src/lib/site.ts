import { isHidden, publicLocales, type Locale } from "@/i18n/config";

export const SITE_NAME = "Eco Straßmayr Energy";

/** Public origin. Set SITE_URL when building (the Docker image takes it as a build argument). */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const PAGES = ["", "/about", "/boilers", "/projects", "/calculator", "/faq", "/contact", "/privacy"] as const;

/** Canonical + hreflang alternates for a path such as "/about". */
export function alternatesFor(lang: Locale, path: string) {
  // The hidden review language is not linked to the public versions.
  if (isHidden(lang)) return { canonical: `/${lang}${path}` };
  return {
    canonical: `/${lang}${path}`,
    languages: { ...Object.fromEntries(publicLocales.map((l) => [l, `/${l}${path}`])), "x-default": `/pl${path}` },
  };
}
