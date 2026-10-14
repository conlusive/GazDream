"use client";

import Link from "next/link";
import { useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/i18n/config";
import { MODELS } from "@/lib/content";

type Props = { lang: Locale; boilers: Dictionary["boilers"]; selector: Dictionary["selector"] };

const maxKw = (range: string) => Number(range.split("–")[1]);

/** Slider that recommends the smallest listed model covering the requested heat output. */
export default function ModelPicker({ lang, boilers, selector }: Props) {
  const [kw, setKw] = useState(2000);
  const best = MODELS.find((m) => maxKw(m.powerKw) >= kw);
  const state = kw < 1000 ? "small" : best ? "match" : "big";

  return (
    <div>
      <div className="card mb-8 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">{selector.title}</h2>
            <label htmlFor="kw" className="mt-1 block text-sm text-muted">{selector.label}</label>
          </div>
          <p className="tabular text-4xl font-extrabold tracking-tight text-brand-green">
            {kw.toLocaleString(lang)} <span className="text-lg font-bold text-ink">{selector.unit}</span>
          </p>
        </div>
        <input id="kw" type="range" min={500} max={7000} step={100} value={kw} onChange={(e) => setKw(Number(e.target.value))} className="mt-5 w-full" />
        <p className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${state === "match" ? "bg-tint text-brand-green" : "bg-soft text-ink"}`}>
          {state === "match" && best ? `${selector.result}: ${best.name}` : state === "small" ? selector.small : selector.big}
        </p>
        <p className="mt-2 text-xs text-muted">{selector.hint}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MODELS.map((m) => {
          const on = state === "match" && best?.name === m.name;
          return (
            <article key={m.name} className={`card flex flex-col border-t-4 p-7 transition-all duration-300 ${on ? "-translate-y-1 border-t-brand-orange shadow-[0_18px_40px_-24px_rgba(11,42,22,0.45)] ring-2 ring-brand-green" : "border-t-transparent"}`}>
              <p className="text-sm font-semibold text-muted">{boilers.types[m.type]}</p>
              <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-brand-green">{m.name}</h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="border-t border-line pt-3">
                  <dt className="text-muted">{boilers.power}</dt>
                  <dd className="mt-0.5 text-lg font-extrabold">{m.powerKw}</dd>
                </div>
                <div className="border-t border-line pt-3">
                  <dt className="text-muted">{boilers.burner}</dt>
                  <dd className="mt-0.5 text-lg font-extrabold">{m.burnerKw}</dd>
                </div>
              </dl>
              <Link href={`/${lang}/contact?model=${encodeURIComponent(m.name)}`} className="btn btn-primary mt-7 w-full">
                {boilers.request}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
