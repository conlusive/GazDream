"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

export default function LangSwitcher({ current, onDark = false }: { current: Locale; onDark?: boolean }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(pl|en|de)(?=\/|$)/, "");

  return (
    <div className={`flex items-center rounded-full p-1 text-xs font-bold transition-colors duration-300 ${onDark ? "bg-white/15 backdrop-blur" : "bg-soft"}`} role="group" aria-label="Language">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
          }}
          // The invisible ::after enlarges the touch area to about 48 px without changing how it looks.
          className={`relative rounded-full px-3 py-2 transition duration-300 after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] ${
            locale === current
              ? "bg-brand-green text-white shadow-sm"
              : onDark
                ? "text-white/80 hover:text-white"
                : "text-muted hover:text-brand-green"
          }`}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
