import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CONTACT } from "@/lib/content";
import Logo from "./Logo";

export default function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const links = [
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}/boilers`, label: dict.nav.boilers },
    { href: `/${lang}/projects`, label: dict.nav.projects },
    { href: `/${lang}/calculator`, label: dict.nav.calculator },
    { href: `/${lang}/faq`, label: dict.nav.faq },
    { href: `/${lang}/contact`, label: dict.nav.contact },
  ];
  return (
    <footer className="bg-forest text-white/80 print:hidden">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="onDark" className="h-24 w-auto" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">{dict.meta.description}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="space-y-0.5 text-sm font-semibold">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="-mx-3 inline-block px-3 py-3 transition hover:text-white hover:underline hover:decoration-brand-orange hover:underline-offset-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <address className="space-y-2 text-sm not-italic">
          <p className="font-bold text-white">{dict.footer.legalName}</p>
          <p>{dict.footer.address}</p>
          <p><a href={CONTACT.phoneHref} className="inline-block py-3 transition hover:text-white">{CONTACT.phone}</a></p>
          <p><a href={`mailto:${CONTACT.email}`} className="inline-block py-3 transition hover:text-white">{CONTACT.email}</a></p>
        </address>
      </div>
      <div className="border-t border-white/10">
        <p className="container-x py-5 text-xs text-white/60">© {dict.footer.legalName} · {dict.hero.badge} · {dict.footer.rights}.</p>
      </div>
    </footer>
  );
}
