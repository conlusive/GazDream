"use client";

import Link from "next/link";
import { useState } from "react";

type Tab = { id: string; label: string; items: string[] };

/** Vertical tabs on desktop, scrollable pills on mobile. */
export default function Applications({ tabs, cta, href }: { tabs: Tab[]; cta: string; href: string }) {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.4fr]">
      <div role="tablist" aria-orientation="vertical" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            id={`app-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls={`app-panel-${t.id}`}
            onClick={() => setActive(i)}
            className={`group flex shrink-0 items-center gap-3 rounded-xl border px-5 py-3.5 text-left text-sm font-bold transition-colors duration-300 lg:text-base ${
              i === active ? "border-forest bg-forest text-white" : "border-line bg-white hover:border-brand-green/50"
            }`}
          >
            <span className={`numeral text-xl ${i === active ? "text-brand-orange" : "text-muted"}`}>{String(i + 1).padStart(2, "0")}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div id={`app-panel-${tab.id}`} role="tabpanel" aria-labelledby={`app-tab-${tab.id}`} className="card min-h-[18rem] p-7 sm:p-10">
        <ul key={tab.id} className="space-y-4">
          {tab.items.map((item, i) => (
            <li key={item} className="rise flex gap-4 border-b border-line pb-4 text-lg last:border-0" style={{ animationDelay: `${i * 70}ms`, animationDuration: "0.5s" }}>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-1.5 h-4 w-4 shrink-0 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5l4 4 8-9" /></svg>
              {item}
            </li>
          ))}
        </ul>
        <Link href={href} className="group mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-green">
          {cta}
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}
