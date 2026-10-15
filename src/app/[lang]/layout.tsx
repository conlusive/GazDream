import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { hasLocale, isHidden, locales } from "@/i18n/config";
import { getDictionary } from "./dictionaries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuickForm from "@/components/QuickForm";
import { CONTACT } from "@/lib/content";
import { alternatesFor, SITE_NAME, SITE_URL } from "@/lib/site";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext", "cyrillic"], display: "swap" });

export const generateStaticParams = () => locales.map((lang) => ({ lang }));

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.title, template: `%s | ${SITE_NAME}` },
    description: dict.meta.description,
    applicationName: SITE_NAME,
    alternates: alternatesFor(lang, ""),
    ...(isHidden(lang) ? { robots: { index: false, follow: false } } : {}),
    openGraph: { siteName: SITE_NAME, title: dict.meta.title, description: dict.meta.description, locale: lang, type: "website", url: `/${lang}` },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={manrope.variable}>
      <body className="flex min-h-screen flex-col pb-20 antialiased lg:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              legalName: dict.footer.legalName,
              url: SITE_URL,
              logo: `${SITE_URL}/brand/logo.svg`,
              telephone: CONTACT.phone,
              email: CONTACT.email,
              address: { "@type": "PostalAddress", streetAddress: "Sielecka 7", postalCode: "37-700", addressLocality: "Przemyśl", addressCountry: "PL" },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Header lang={lang} nav={dict.nav} cta={dict.cta} />
        <main className="flex-1">{children}</main>
        <QuickForm lang={lang} dict={dict.quick} calcLabel={dict.nav.calculator} />
        <Footer lang={lang} dict={dict} />
        <a
          href={CONTACT.phoneHref}
          className="fixed inset-x-3 bottom-3 z-50 rounded-md bg-brand-green py-3.5 text-center text-sm font-bold text-white transition active:scale-[0.98] print:hidden lg:hidden"
        >
          {dict.cta.call}: {CONTACT.phone}
        </a>
      </body>
    </html>
  );
}
