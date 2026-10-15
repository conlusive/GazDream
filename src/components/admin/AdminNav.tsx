"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };
export type NavGroup = { label?: string; items: NavItem[] };

/** Grouped side navigation on desktop; on phones the same links become one scrollable row. */
export default function AdminNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Розділи адмінки" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
      {groups.map((group, i) => (
        <div key={group.label ?? i} className="flex gap-1 lg:flex-col">
          {group.label && <p className="hidden px-4 pb-1 text-xs font-semibold text-white/60 lg:block">{group.label}</p>}
          {group.items.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-white text-forest" : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
