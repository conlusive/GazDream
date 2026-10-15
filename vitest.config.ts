import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "test/server-only.ts"),
    },
  },
  test: {
    // Browser tests live in e2e/ and run with Playwright (`npm run e2e`).
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    // In-memory Postgres (PGlite) for repository tests.
    env: { PGLITE_DIR: "memory", DATABASE_URL: "" },
    testTimeout: 30_000,
  },
});
