import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import LangSwitcher from "./LangSwitcher";
import MobileMenu from "./MobileMenu";

type Props = { lang: Locale; nav: Dictionary["nav"]; cta: Dictionary["cta"] };

export default function Header({ lang, nav, cta }: Props) {
  const links = [
    { href: `/${lang}`, label: nav.home },
    { href: `/${lang}/about`, label: nav.about },
    { href: `/${lang}/boilers`, label: nav.boilers },
    { href: `/${lang}/projects`, label: nav.projects },
    { href: `/${lang}/calculator`, label: nav.calculator },
    { href: `/${lang}/faq`, label: nav.faq },
    { href: `/${lang}/contact`, label: nav.contact },
  ];

  return (
    <header className="print:hidden sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${lang}`} aria-label="GazDream">
          <Image src="/brand/logo.jpg" alt="Eco Straßmayr Energy" width={120} height={60} priority />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-green">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitcher current={lang} />
          <MobileMenu label={nav.menu} links={links} />
          <Link
            href={`/${lang}/calculator`}
            className="hidden rounded-md bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-dark sm:inline-block"
          >
            {cta.calculate}
          </Link>
        </div>
      </div>
    </header>
  );
}
