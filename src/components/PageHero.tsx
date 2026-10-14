export default function PageHero({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header className="border-b border-line bg-soft">
      <div className="container-x py-14 sm:py-20">
        {eyebrow && <p className="eyebrow rise mb-4">{eyebrow}</p>}
        <h1 className="display rise max-w-4xl text-4xl sm:text-6xl" style={{ animationDelay: "60ms" }}>
          {title}
        </h1>
        {lead && (
          <p className="lead rise mt-5 max-w-2xl" style={{ animationDelay: "140ms" }}>
            {lead}
          </p>
        )}
      </div>
    </header>
  );
}
