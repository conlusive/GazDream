import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "./dictionaries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuickForm from "@/components/QuickForm";
import { CONTACT } from "@/lib/content";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"], display: "swap" });

export const generateStaticParams = () => locales.map((lang) => ({ lang }));

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={manrope.variable}>
      <body className="flex min-h-screen flex-col pb-20 antialiased lg:pb-0">
        <Header lang={lang} nav={dict.nav} cta={dict.cta} />
        <main className="flex-1">{children}</main>
        <QuickForm lang={lang} dict={dict.quick} calcLabel={dict.nav.calculator} />
        <Footer lang={lang} dict={dict} />
        <a
          href={CONTACT.phoneHref}
          className="fixed inset-x-3 bottom-3 z-50 rounded-full bg-brand-green py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_30px_-8px_rgba(11,42,22,0.6)] transition active:scale-[0.98] print:hidden lg:hidden"
        >
          {dict.cta.call}: {CONTACT.phone}
        </a>
      </body>
    </html>
  );
}
