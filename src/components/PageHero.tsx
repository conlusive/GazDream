export default function PageHero({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header className="border-b border-line bg-soft">
      <div className="container-x py-12 sm:py-16">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="display max-w-4xl text-3xl sm:text-5xl">{title}</h1>
        {lead && <p className="lead mt-4 max-w-2xl">{lead}</p>}
      </div>
    </header>
  );
}
