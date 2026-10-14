"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

export default function LangSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(pl|en|de)(?=\/|$)/, "");

  return (
    <div className="flex items-center text-xs font-semibold" role="group" aria-label="Language">
      {locales.map((locale, i) => (
        <span key={locale} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="text-line">/</span>}
          <Link
            href={`/${locale}${rest}`}
            hrefLang={locale}
            aria-current={locale === current ? "true" : undefined}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={`px-2 py-2 transition-colors ${locale === current ? "text-ink underline decoration-brand-green decoration-2 underline-offset-[6px]" : "text-muted hover:text-ink"}`}
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
