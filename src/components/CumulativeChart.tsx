"use client";

import { useState, type PointerEvent } from "react";

type Props = {
  perPeriod: number;
  boilerPrice: number;
  formatMoney: (n: number) => string;
  labels: { after: string; unit: string; boiler: string; payback: string };
};

const W = 560;
const H = 240;
const PAD = { l: 8, r: 16, t: 24, b: 32 };
const N = 8; // periods shown

/** Cumulative savings over N periods, optional boiler price line with the payback point, hover readout. */
export default function CumulativeChart({ perPeriod, boilerPrice, formatMoney, labels }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const top = Math.max(perPeriod * N, boilerPrice * 1.15) * 1.05;
  const x = (i: number) => PAD.l + (i / N) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.t - PAD.b);
  const points = Array.from({ length: N + 1 }, (_, i) => ({ i, v: perPeriod * i }));
  const line = points.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(N)},${y(0)} L${x(0)},${y(0)} Z`;

  const paybackAt = boilerPrice > 0 && perPeriod > 0 ? boilerPrice / perPeriod : null;
  const paybackVisible = paybackAt !== null && paybackAt <= N;
  const active = hover ?? N;

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - box.left) / box.width;
    setHover(Math.max(0, Math.min(N, Math.round(ratio * N))));
  };

  const readout = labels.after.replace("{n}", String(active)).replace("{unit}", labels.unit);

  return (
    <div className="mt-4">
      <p className="tabular text-sm">
        <span className="text-muted">{readout}: </span>
        <strong className="text-lg font-extrabold text-brand-green">{formatMoney(perPeriod * active)}</strong>
        {boilerPrice > 0 && (
          <span className="ml-2 text-xs text-muted">
            ({labels.boiler}: {formatMoney(boilerPrice)}
            {paybackVisible ? ` · ${labels.payback}: ${paybackAt.toFixed(1)}` : ""})
          </span>
        )}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full touch-none select-none" role="img" aria-label={`${readout}: ${formatMoney(perPeriod * active)}`}>
        <defs>
          <linearGradient id="cum-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-green)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-brand-green)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={PAD.l} x2={W - PAD.r} y1={y(top * g)} y2={y(top * g)} stroke="var(--color-line)" strokeWidth="1" />
        ))}
        {points.map((p) => (
          <text key={p.i} x={x(p.i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
            {p.i}
          </text>
        ))}

        <path d={area} fill="url(#cum-fill)" />
        <path d={line} fill="none" stroke="var(--color-brand-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {boilerPrice > 0 && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(boilerPrice)} y2={y(boilerPrice)} stroke="var(--color-brand-orange)" strokeWidth="2" strokeDasharray="6 5" />
            <text x={W - PAD.r} y={y(boilerPrice) - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--color-brand-orange-dark)">
              {labels.boiler}
            </text>
          </g>
        )}

        {paybackVisible && paybackAt !== null && (
          <g>
            <circle cx={x(paybackAt)} cy={y(boilerPrice)} r="7" fill="white" stroke="var(--color-brand-orange)" strokeWidth="3" />
            <text x={x(paybackAt)} y={y(boilerPrice) + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-ink)">
              {labels.payback}: {paybackAt.toFixed(1)}
            </text>
          </g>
        )}

        <g>
          <line x1={x(active)} x2={x(active)} y1={PAD.t - 8} y2={H - PAD.b} stroke="var(--color-ink)" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={x(active)} cy={y(perPeriod * active)} r="6" fill="var(--color-brand-green)" stroke="white" strokeWidth="3" />
        </g>

        <rect
          x={PAD.l}
          y={0}
          width={W - PAD.l - PAD.r}
          height={H}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
    </div>
  );
}
