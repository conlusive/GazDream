import { publicLocales as locales } from "@/i18n/config";
import { PAGES } from "@/lib/site";

// Read per request so the public origin can be set at runtime.
export async function GET() {
  const origin = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const entries = locales.flatMap((lang) =>
    PAGES.map((path) => {
      const alternates = locales
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${origin}/${l}${path}"/>`)
        .join("\n");
      return `  <url>\n    <loc>${origin}/${lang}${path}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/pl${path}"/>\n  </url>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
