import type { Metadata } from "next";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { isHidden, type Locale } from "@/i18n/config";
import { alternatesFor } from "./site";

type PageKey = Exclude<keyof Dictionary["seo"], never>;

/** Metadata for one inner page: its own title/description, canonical and hreflang. */
export function pageMetadata(lang: Locale, dict: Dictionary, key: PageKey, path: string): Metadata {
  const { title, description } = dict.seo[key];
  return {
    title,
    description,
    alternates: alternatesFor(lang, path),
    ...(isHidden(lang) ? { robots: { index: false, follow: false } } : {}),
    openGraph: { title, description, locale: lang, type: "website", url: `/${lang}${path}` },
  };
}
