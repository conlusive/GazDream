"use client";

import { useEffect, useRef, useState } from "react";

type Props = { value: number; format: (n: number) => string; duration?: number };

/** Counts from the previously shown value to the new one. Renders the final value on the server. */
export default function AnimatedNumber({ value, format, duration = 600 }: Props) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduceMotion ? 0 : duration;
    const begin = from.current;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      // rAF timestamps can precede performance.now(), so clamp to avoid undershooting the start value.
      const t = total === 0 ? 1 : Math.min(1, Math.max(0, (now - startedAt) / total));
      const eased = 1 - Math.pow(1 - t, 3);
      const current = t === 1 ? value : begin + (value - begin) * eased;
      from.current = current;
      setShown(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{format(shown)}</>;
}
