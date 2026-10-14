import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/PageHero";
import { hasLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "../dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return pageMetadata(lang, await getDictionary(lang), "privacy", "/privacy");
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const p = dict.privacy;

  return (
    <>
      <PageHero eyebrow={dict.hero.badge} title={p.title} lead={p.updated} />
      <section className="section">
        <div className="container-x max-w-3xl space-y-10">
          {p.sections.map((s) => (
            <article key={s.h}>
              <h2 className="text-xl font-extrabold tracking-tight">{s.h}</h2>
              {s.p.map((t) => (
                <p key={t} className="mt-3 leading-relaxed text-muted">{t}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
