"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

export default function LangSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(pl|en|de)(?=\/|$)/, "");

  return (
    <div className="flex items-center rounded-full bg-soft p-1 text-xs font-bold" role="group" aria-label="Language">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={`rounded-full px-3 py-2 transition duration-300 ${
            locale === current ? "bg-brand-green text-white shadow-sm" : "text-muted hover:text-brand-green"
          }`}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
