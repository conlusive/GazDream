import Image from "next/image";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "../dictionaries";

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const { about } = dict;

  return (
    <>
      <PageHero eyebrow={dict.hero.badge} title={about.title} lead={about.lead} />

      <section className="section !pb-10">
        <dl className="container-x grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {about.stats.map((s) => (
            <div key={s.l} className="reveal border-l-2 border-brand-orange pl-5">
              <dt className="text-3xl font-bold tracking-tight text-brand-green sm:text-4xl">{s.v}</dt>
              <dd className="mt-1 text-sm text-muted">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal space-y-10">
            <div>
              <h2 className="display text-3xl sm:text-4xl">{about.techTitle}</h2>
              <p className="mt-4 text-muted">{about.tech}</p>
            </div>
            <div className="card p-7">
              <h3 className="text-xl font-bold">{about.officeTitle}</h3>
              <p className="mt-2 text-muted">{about.officeText}</p>
            </div>
            <ButtonLink href={`/${lang}/contact`}>{dict.cta.request}</ButtonLink>
          </div>
          <div className="reveal overflow-hidden rounded-lg">
            <Image src="/photos/install-container.jpg" alt="" width={1280} height={960} className="" />
          </div>
        </div>
      </section>
    </>
  );
}
