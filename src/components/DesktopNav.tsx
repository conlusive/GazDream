"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DesktopNav({ links, onDark = false }: { links: { href: string; label: string }[]; onDark?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
      {links.map((l, i) => {
        const active = i === 0 ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className={`link-underline py-1 transition-colors ${onDark ? "text-white/90 hover:text-white aria-[current=page]:text-white" : "hover:text-brand-green aria-[current=page]:text-brand-green"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
