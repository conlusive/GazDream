import Image from "next/image";

const PILLS = ["/photos/site-2.jpg", "/photos/plant-2.jpg", "/photos/site-3.jpg", "/photos/plant-3.jpg", "/photos/workshop-1.jpg", "/photos/site-1.jpg"];

function Group({ items, hidden }: { items: string[]; hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {items.map((text, i) => (
        <li key={text} className="flex items-center gap-8">
          <span className="whitespace-nowrap text-3xl font-extrabold tracking-tight sm:text-5xl">{text}</span>
          {i % 2 === 0 ? (
            <Image src={PILLS[i % PILLS.length]} alt="" width={120} height={52} className="h-11 w-28 rounded-full object-cover sm:h-14 sm:w-36" />
          ) : (
            <span aria-hidden="true" className="text-3xl text-brand-orange sm:text-4xl">✦</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Endless ticker. The track holds two identical groups and slides by exactly half its width. */
export default function Marquee({ items }: { items: string[] }) {
  return (
    <div className="marquee overflow-hidden border-b border-line py-7 sm:py-9">
      <div className="marquee-track">
        <Group items={items} />
        <Group items={items} hidden />
      </div>
    </div>
  );
}
