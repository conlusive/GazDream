"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

export default function LangSwitcher({ current, onDark = false }: { current: Locale; onDark?: boolean }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(pl|en|de)(?=\/|$)/, "");

  return (
    <div className={`flex items-center rounded-full p-0.5 text-xs font-bold transition-colors duration-300 ${onDark ? "bg-white/15 backdrop-blur" : "bg-soft"}`} role="group" aria-label="Language">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={`inline-flex min-h-11 items-center rounded-full px-3.5 transition duration-300 ${
            locale === current ? "bg-brand-green text-white shadow-sm" : onDark ? "text-white/80 hover:text-white" : "text-muted hover:text-brand-green"
          }`}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
