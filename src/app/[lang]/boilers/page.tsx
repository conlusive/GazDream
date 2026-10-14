import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { MODELS } from "@/lib/content";
import { getDictionary } from "../dictionaries";

export default async function BoilersPage({ params }: PageProps<"/[lang]/boilers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { boilers: b } = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{b.title}</h1>
      <p className="mt-3 max-w-3xl text-lg text-muted">{b.lead}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MODELS.map((m) => (
          <article key={m.name} className="flex flex-col rounded-xl border border-line p-5">
            <h2 className="text-xl font-bold text-brand-green">{m.name}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-muted">{b.power}</dt><dd className="font-semibold">{m.powerKw}</dd></div>
              <div><dt className="text-muted">{b.type}</dt><dd className="font-semibold">{b.types[m.type]}</dd></div>
              <div><dt className="text-muted">{b.burner}</dt><dd className="font-semibold">{m.burnerKw}</dd></div>
            </dl>
            <Link
              href={`/${lang}/contact?model=${encodeURIComponent(m.name)}`}
              className="mt-5 rounded-md bg-brand-orange px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-orange-dark"
            >
              {b.request}
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">{b.fuel}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">{b.includesTitle}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            {b.includes.map((i) => <li key={i}>{i}</li>)}
          </ul>
          <h2 className="mt-8 text-2xl font-bold">{b.optionsTitle}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            {b.options.map((i) => <li key={i}>{i}</li>)}
          </ul>
        </div>
        <Image src="/photos/site-1.jpg" alt="" width={851} height={1280} className="max-h-[560px] w-full rounded-xl object-cover" />
      </div>
    </div>
  );
}
