import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "./dictionaries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CONTACT } from "@/lib/content";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

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
    <html lang={lang} className={inter.variable}>
      <body className="flex min-h-screen flex-col pb-16 antialiased lg:pb-0">
        <Header lang={lang} nav={dict.nav} cta={dict.cta} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} dict={dict} />
        <a
          href={CONTACT.phoneHref}
          className="fixed inset-x-0 bottom-0 z-50 print:hidden bg-brand-green py-4 text-center text-base font-semibold text-white lg:hidden"
        >
          {dict.cta.call}: {CONTACT.phone}
        </a>
      </body>
    </html>
  );
}
