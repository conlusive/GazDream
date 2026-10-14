import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ButtonLink } from "./ui/Button";
import DesktopNav from "./DesktopNav";
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
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-xl print:hidden">
      <div className="container-x flex h-[68px] items-center justify-between gap-4">
        <Link href={`/${lang}`} aria-label="GazDream" className="shrink-0 transition-opacity hover:opacity-80">
          <Image src="/brand/logo.jpg" alt="Eco Straßmayr Energy" width={104} height={52} priority />
        </Link>
        <DesktopNav links={links} />
        <div className="flex items-center gap-2 sm:gap-3">
          <LangSwitcher current={lang} />
          <ButtonLink href={`/${lang}/calculator`} className="hidden !px-5 !py-2.5 sm:inline-flex">
            {cta.calculate}
          </ButtonLink>
          <MobileMenu label={nav.menu} links={links} />
        </div>
      </div>
    </header>
  );
}
