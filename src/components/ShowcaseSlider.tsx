"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

export type Slide = {
  id: string;
  kicker: string;
  title: string;
  text?: string;
  big?: string;
  rows?: { label: string; value: string }[];
  photo: string;
};

type Props = { slides: Slide[]; caption: string; label: string; durationMs?: number };

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedNow = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Auto-advancing showcase with a progress line per slide. Slides are stacked in one grid cell and
 * cross-fade, so the height never jumps. Pauses on hover/focus; no auto-advance with reduced motion.
 */
export default function ShowcaseSlider({ slides, caption, label, durationMs = 6500 }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribe, reducedNow, () => false);
  const next = () => setActive((i) => (i + 1) % slides.length);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div role="tablist" aria-label={label} className="mb-8 grid gap-3" style={{ gridTemplateColumns: `repeat(${slides.length}, 1fr)` }}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            id={`tab-${s.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${s.id}`}
            onClick={() => setActive(i)}
            className="group text-left"
          >
            <span className={`tabular text-sm font-extrabold transition-colors duration-300 ${i === active ? "text-ink" : "text-muted group-hover:text-ink"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mt-2 block h-0.5 overflow-hidden rounded-full bg-line">
              <span
                key={i === active ? `a-${active}` : `i-${i}`}
                className="block h-full origin-left bg-brand-orange"
                style={
                  i < active || (reduced && i === active)
                    ? { transform: "scaleX(1)" }
                    : i === active
                      ? { animation: `slide-fill ${durationMs}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }
                      : { transform: "scaleX(0)" }
                }
                onAnimationEnd={i === active ? next : undefined}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="grid">
        {slides.map((s, i) => {
          const on = i === active;
          return (
            <div
              key={s.id}
              id={`panel-${s.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${s.id}`}
              inert={!on}
              className={`col-start-1 row-start-1 grid items-stretch gap-6 transition-opacity duration-700 ease-out lg:grid-cols-[1.15fr_1fr] ${on ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <figure className="relative min-h-[280px] overflow-hidden rounded-3xl sm:min-h-[380px]">
                <Image
                  src={s.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className={`object-cover transition-transform duration-[1600ms] ease-out ${on ? "scale-100" : "scale-110"}`}
                />
                <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-muted backdrop-blur">
                  {caption}
                </figcaption>
              </figure>
              <div className="flex flex-col justify-between rounded-3xl bg-mint p-7 sm:p-9">
                <div>
                  <p className="eyebrow mb-3">{s.kicker}</p>
                  {s.big && <p className="tabular text-6xl font-extrabold tracking-tight text-brand-green sm:text-7xl">{s.big}</p>}
                  <h3 className={`display ${s.big ? "mt-3 text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}>{s.title}</h3>
                  {s.text && <p className="mt-4 text-muted">{s.text}</p>}
                </div>
                {s.rows && (
                  <dl className="mt-8 space-y-2 text-sm">
                    {s.rows.map((r) => (
                      <div key={r.label} className="flex justify-between gap-4 border-t border-brand-green/15 pt-2">
                        <dt className="text-muted">{r.label}</dt>
                        <dd className="text-right font-bold">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
