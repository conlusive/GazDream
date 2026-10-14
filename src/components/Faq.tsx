type Item = { q: string; a: string };

/** Native <details> accordion: keyboard accessible, works without JavaScript, animates where supported. */
export default function Faq({ items }: { items: readonly Item[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold transition-colors hover:text-brand-green sm:text-lg [&::-webkit-details-marker]:hidden">
            {item.q}
            <span aria-hidden="true" className="shrink-0 text-2xl font-light leading-none text-muted transition-transform duration-300 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="max-w-2xl pt-3 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
