import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "../dictionaries";

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { about } = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{about.title}</h1>
      <p className="mt-3 max-w-3xl text-lg text-muted">{about.lead}</p>

      <dl className="my-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {about.stats.map((s) => (
          <div key={s.l} className="rounded-lg border border-line p-5">
            <dt className="text-2xl font-bold text-brand-green sm:text-3xl">{s.v}</dt>
            <dd className="mt-1 text-sm text-muted">{s.l}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">{about.techTitle}</h2>
          <p className="mt-3 text-muted">{about.tech}</p>
          <h2 className="mt-8 text-2xl font-bold">{about.officeTitle}</h2>
          <p className="mt-3 text-muted">{about.officeText}</p>
        </div>
        <Image src="/photos/plant-2.jpg" alt="" width={1272} height={900} className="rounded-xl" />
      </div>
    </div>
  );
}
