export async function GET() {
  const origin = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  // Demo/staging deployments (NOINDEX=1) ask crawlers to stay away from everything.
  const body = process.env.NOINDEX === "1"
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
