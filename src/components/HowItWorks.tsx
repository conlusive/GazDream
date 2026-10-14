"use client";

import { useState, useSyncExternalStore } from "react";
import { rich } from "@/lib/rich";

type Step = { t: string; x: string };
type Props = { eyebrow: string; title: string; hint: string; steps: Step[]; stepMs?: number };

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reducedNow = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Icon({ i }: { i: number }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="-40 -40 80 80" className="h-12 w-12" aria-hidden="true">
      {i === 0 && (
        <g {...p}>
          <path d="M-24 -26 H24 L12 6 H-12 Z" />
          <path d="M-12 6 V20 H12 V6" />
        </g>
      )}
      {i === 1 && (
        <g {...p}>
          <path d="M0 -30 C10 -14 26 -8 24 10 C22 28 -22 28 -24 10 C-26 -6 -10 -12 0 -30 Z" />
          <path d="M0 -2 C6 6 12 8 10 16 C8 24 -8 24 -10 16 C-12 8 -4 6 0 -2 Z" />
        </g>
      )}
      {i === 2 && (
        <g {...p}>
          <rect x="-28" y="-26" width="56" height="52" rx="5" />
          <path d="M-18 -12 H18 M-18 0 H18 M-18 12 H18" strokeDasharray="3 5" />
        </g>
      )}
      {i === 3 && (
        <g {...p}>
          <rect x="-16" y="-30" width="32" height="56" rx="3" />
          <path d="M-16 -16 H16 M-16 -2 H16 M-16 12 H16" />
        </g>
      )}
    </svg>
  );
}

/**
 * Four process stages that advance by themselves (a progress line fills on the active card) and can
 * be clicked at any time. Auto-advance pauses on hover/focus and is off with reduced motion.
 * Explanations are stacked in one grid cell and cross-fade, so the layout never jumps.
 */
export default function HowItWorks({ eyebrow, title, hint, steps, stepMs = 7000 }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(subscribe, reducedNow, () => false);
  const next = () => setActive((i) => (i + 1) % steps.length);

  return (
    <div>
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 className="display max-w-3xl text-3xl sm:text-5xl">{rich(title)}</h2>
      <p className="mt-3 text-sm text-muted">{hint}</p>

      <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div role="tablist" aria-label={title} className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {steps.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={s.t}
              role="tab"
              id={`how-tab-${i}`}
              aria-selected={on}
              aria-controls={`how-panel-${i}`}
              onClick={() => setActive(i)}
              className={`relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border-2 p-5 text-left transition-colors duration-500 ${
                on ? "border-brand-green bg-tint text-ink" : "border-line bg-white text-muted hover:border-brand-green/50 hover:text-ink"
              }`}
            >
              <span className={`transition-colors duration-500 ${on ? "text-brand-green" : "text-muted/70"}`}><Icon i={i} /></span>
              <span>
                <span className="block text-xs font-bold text-brand-green">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-base font-bold">{s.t}</span>
              </span>
              <span className="absolute inset-x-0 bottom-0 h-1 bg-line" aria-hidden="true">
                <span
                  key={on ? `a-${active}` : `i-${i}`}
                  className="block h-full origin-left bg-brand-green"
                  style={
                    i < active || (reduced && on)
                      ? { transform: "scaleX(1)" }
                      : on
                        ? { animation: `slide-fill ${stepMs}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }
                        : { transform: "scaleX(0)" }
                  }
                  onAnimationEnd={on ? next : undefined}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid rounded-2xl border border-line bg-soft">
        {steps.map((s, i) => {
          const on = i === active;
          return (
            <div
              key={s.t}
              id={`how-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`how-tab-${i}`}
              inert={!on}
              className={`col-start-1 row-start-1 p-6 transition-opacity duration-700 ease-out sm:p-8 ${on ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <p className="max-w-3xl text-lg leading-relaxed text-ink">{s.x}</p>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}