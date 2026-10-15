type Testimonial = { id: number; quote: string; author: string; role: string; location: string };

/** Renders nothing until real, permission-based quotes are added in the admin. */
export default function Testimonials({ title, items }: { title: string; items: readonly Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="section">
      <div className="container-x">
        <h2 className="display reveal mb-12 text-3xl sm:text-5xl">{title}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.id} className="card reveal p-7">
              <blockquote className="text-lg leading-relaxed">“{t.quote}”</blockquote>
              <figcaption className="mt-5 text-sm text-muted">
                <strong className="text-ink">{t.author}</strong>
                {[t.role, t.location].filter(Boolean).map((x) => ` · ${x}`)}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
