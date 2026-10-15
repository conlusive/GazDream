import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Self-contained server bundle (used by the Docker image).
  output: "standalone",
  poweredByHeader: false,
  // Database drivers are loaded from node_modules at runtime instead of being bundled (PGlite ships WASM).
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // Runtime data (owner prices, lead log) must never be copied into the build output.
  outputFileTracingExcludes: { "*": ["./data/**"] },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Optimized variants are generated once and kept for a month.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    // Large static media: cache for a week and revalidate in the background for a month.
    const longCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    ];
    return [
      { source: "/:path*", headers: process.env.NOINDEX === "1" ? [...security, { key: "X-Robots-Tag", value: "noindex, nofollow" }] : security },
      { source: "/video/:path*", headers: longCache },
      { source: "/photos/:path*", headers: longCache },
      { source: "/brand/:path*", headers: longCache },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
