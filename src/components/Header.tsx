"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ButtonLink } from "./ui/Button";
import DesktopNav from "./DesktopNav";
import LangSwitcher from "./LangSwitcher";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";

type Props = { lang: Locale; nav: Dictionary["nav"]; cta: Dictionary["cta"] };

const subscribe = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
};
const scrolledNow = () => window.scrollY > 24;

/**
 * Fixed header. Transparent over the hero photo at the top of the page (light text and logo so
 * everything stays visible), turning into a solid white bar once the page is scrolled.
 */
export default function Header({ lang, nav, cta }: Props) {
  const scrolled = useSyncExternalStore(subscribe, scrolledNow, () => false);
  const onDark = !scrolled;

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
    <header
      style={{ backgroundColor: scrolled ? "#ffffff" : "transparent" }}
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 print:hidden ${
        scrolled ? "border-b border-line shadow-sm" : "border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-[68px] items-center justify-between gap-4">
        <Link href={`/${lang}`} aria-label="Eco Straßmayr Energy" className="shrink-0 transition-opacity hover:opacity-85">
          <Logo tone={onDark ? "onDark" : "default"} className="h-14 w-auto" />
        </Link>
        <DesktopNav links={links} onDark={onDark} />
        <div className="flex items-center gap-2 sm:gap-3">
          <LangSwitcher current={lang} onDark={onDark} />
          <ButtonLink href={`/${lang}/calculator`} className="hidden !px-5 !py-2.5 sm:inline-flex">
            {cta.calculate}
          </ButtonLink>
          <MobileMenu label={nav.menu} links={links} onDark={onDark} />
        </div>
      </div>
    </header>
  );
}
