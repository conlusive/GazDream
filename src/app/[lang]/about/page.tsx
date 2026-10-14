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
            <div key={s.l} className="reveal min-w-0 border-l-4 border-brand-orange pl-4 sm:pl-5">
              <dt className="text-2xl font-extrabold tracking-tight text-brand-green sm:text-4xl">{s.v}</dt>
              <dd className="mt-1 text-sm text-muted [overflow-wrap:anywhere] hyphens-auto">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="reveal space-y-8">
            <div>
              <h2 className="display text-3xl sm:text-4xl">{about.techTitle}</h2>
              <p className="mt-4 text-muted">{about.tech}</p>
            </div>
            <div className="card border-l-4 border-l-brand-green p-7">
              <h3 className="text-xl font-extrabold">{about.officeTitle}</h3>
              <p className="mt-2 text-muted">{about.officeText}</p>
            </div>
            <ButtonLink href={`/${lang}/contact`}>{dict.cta.request}</ButtonLink>
          </div>
          <div className="reveal overflow-hidden rounded-3xl">
            <Image src="/photos/install-container.jpg" alt={dict.installation.captions[1]} width={1280} height={960} className="transition-transform duration-700 ease-out-soft hover:scale-105" />
          </div>
        </div>
      </section>
    </>
  );
}
