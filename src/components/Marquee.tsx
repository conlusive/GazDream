type Item = { v: string; l: string };

function Group({ items, hidden }: { items: Item[]; hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <li key={it.l} className="flex items-center">
          <span className="flex items-baseline gap-3 whitespace-nowrap px-8 sm:px-12">
            <span className="text-3xl font-extrabold tracking-tight sm:text-5xl">{it.v}</span>
            <span className="text-sm font-semibold text-white/90 sm:text-lg">{it.l}</span>
          </span>
          <span aria-hidden="true" className="h-2 w-2 rotate-45 bg-white/70" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Endless ticker of key figures: white text on the accent colour. The track holds two identical
 * groups and slides by half its width, so the loop is seamless. Pauses on hover; static with reduced motion.
 */
export default function Marquee({ items, label }: { items: Item[]; label: string }) {
  return (
    <section aria-label={label} className="marquee overflow-hidden bg-brand-orange py-6 text-white sm:py-8">
      <div className="marquee-track">
        <Group items={items} />
        <Group items={items} hidden />
      </div>
    </section>
  );
}
