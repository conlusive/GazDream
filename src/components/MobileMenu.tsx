"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = { label: string; links: { href: string; label: string }[] };

/** Collapsible nav for small screens: closes on navigation, Escape and outside click. */
export default function MobileMenu({ label, links }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const close = () => {
      if (ref.current) ref.current.open = false;
    };
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className="relative lg:hidden">
      <summary
        aria-label={label}
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-soft transition hover:bg-line [&::-webkit-details-marker]:hidden"
      >
        <span className="block h-0.5 w-5 bg-ink shadow-[0_-6px_0_0_currentColor,0_6px_0_0_currentColor]" />
      </summary>
      <nav className="rise absolute right-0 mt-3 w-64 rounded-2xl border border-line bg-white p-2 shadow-[0_24px_48px_-20px_rgba(11,42,22,0.35)]" style={{ animationDuration: "0.35s" }}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 text-base font-semibold transition hover:bg-soft hover:text-brand-green">
            {l.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
