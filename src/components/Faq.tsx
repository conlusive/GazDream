type Item = { q: string; a: string };

/** Native <details> accordion: keyboard accessible and works without JavaScript. */
export default function Faq({ items }: { items: readonly Item[] }) {
  return (
    <div className="divide-y divide-line rounded-xl border border-line">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
            {item.q}
            <span aria-hidden="true" className="text-xl text-brand-green transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
