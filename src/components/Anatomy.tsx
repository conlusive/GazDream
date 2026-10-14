"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";
import { rich } from "@/lib/rich";

type Item = { t: string; x: string };
// Marker positions (% of the photo) for: hopper, screw feeder, burner, heat exchanger container.
const SPOTS = [
  { x: 83, y: 57 },
  { x: 63, y: 34 },
  { x: 55, y: 45 },
  { x: 24, y: 50 },
];

/** Real photo with clickable markers; each marker and list entry explains one part of the installation. */
export default function Anatomy({ eyebrow, title, hint, items, photo, alt }: { eyebrow: string; title: string; hint: string; items: Item[]; photo: StaticImageData; alt: string }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 className="display max-w-3xl text-3xl sm:text-5xl">{rich(title)}</h2>
      <p className="mt-3 text-sm text-muted">{hint}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="relative overflow-hidden rounded-3xl bg-soft">
          <Image src={photo} alt={alt} placeholder="blur" sizes="(min-width: 1024px) 60vw, 100vw" className="h-auto w-full" />
          {items.map((it, i) => {
            const on = i === active;
            return (
              <button
                key={it.t}
                type="button"
                onClick={() => setActive(i)}
                aria-label={it.t}
                aria-pressed={on}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${SPOTS[i].x}%`, top: `${SPOTS[i].y}%` }}
              >
                <span className={`absolute inset-0 -m-2 rounded-full transition-opacity duration-300 ${on ? "animate-ping bg-white/60" : "opacity-0"}`} aria-hidden="true" />
                <span className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white text-sm font-extrabold shadow-md transition-colors duration-300 ${on ? "bg-brand-green text-white" : "bg-white text-ink hover:bg-tint"}`}>
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="space-y-2">
          {items.map((it, i) => {
            const on = i === active;
            return (
              <li key={it.t}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-expanded={on}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-colors duration-300 ${on ? "border-brand-green bg-tint" : "border-line bg-white hover:border-brand-green/50"}`}
                >
                  <span className="flex items-center gap-3 font-extrabold">
                    <span className={`tabular flex h-7 w-7 items-center justify-center rounded-full text-xs ${on ? "bg-brand-green text-white" : "bg-soft text-muted"}`}>{i + 1}</span>
                    {it.t}
                  </span>
                  {on && <span className="rise mt-2 block pl-10 text-sm leading-relaxed text-muted" style={{ animationDuration: "0.4s" }}>{it.x}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
