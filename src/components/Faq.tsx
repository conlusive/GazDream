type Item = { q: string; a: string };

/** Native <details> accordion: keyboard accessible, works without JavaScript, animates where supported. */
export default function Faq({ items }: { items: readonly Item[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-bold tracking-tight transition-colors hover:text-brand-green [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft text-xl leading-none text-brand-green transition duration-300 group-open:rotate-45 group-open:bg-brand-green group-open:text-white"
            >
              +
            </span>
          </summary>
          <p className="max-w-2xl pb-5 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
