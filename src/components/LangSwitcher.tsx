"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

export default function LangSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(pl|en|de)(?=\/|$)/, "");

  return (
    <div className="flex items-center gap-1 text-sm font-semibold" role="group" aria-label="Language">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={
            locale === current
              ? "rounded px-2 py-1 bg-brand-green text-white"
              : "rounded px-2 py-1 text-muted hover:text-brand-green"
          }
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
