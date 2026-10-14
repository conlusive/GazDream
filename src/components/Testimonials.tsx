type Testimonial = { quote: string; author: string; role?: string; location?: string };

/** Renders nothing until real, permission-based quotes are added to the dictionaries. */
export default function Testimonials({ title, items }: { title: string; items: readonly Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="mb-8 text-2xl font-bold sm:text-3xl">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <figure key={t.author + t.quote} className="rounded-xl border border-line p-6">
            <blockquote className="text-ink">“{t.quote}”</blockquote>
            <figcaption className="mt-4 text-sm text-muted">
              <strong className="text-ink">{t.author}</strong>
              {[t.role, t.location].filter(Boolean).map((x) => ` · ${x}`)}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
