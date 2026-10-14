"use client";

import { useEffect, useRef, useState } from "react";

// Only serializable props: this component is rendered from Server Components.
type Props = { to: number; prefix?: string; suffix?: string; decimals?: number; duration?: number; className?: string };

/** Counts from 0 to `to` the first time the number scrolls into view. Server markup shows the final value. */
export default function CountUp({ to, prefix = "", suffix = "", decimals = 0, duration = 1400, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const run = () => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - startedAt) / duration));
        setValue(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}
