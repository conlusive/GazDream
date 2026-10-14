import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Optimized variants are generated once and kept for a month.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    // Large static media: cache for a week and revalidate in the background for a month.
    const longCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];
    return [
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
