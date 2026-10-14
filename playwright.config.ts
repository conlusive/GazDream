import { defineConfig } from "@playwright/test";

const PORT = 3210;
const SMTP_PORT = 2599;

// Runs against a production build (`npm run build` first). Uses the Chrome that is installed on the
// machine, so no browser download is needed. A throwaway SMTP server in the tests receives the mail.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next start -H 127.0.0.1 -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/pl`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: String(SMTP_PORT),
      SMTP_USER: "bot@strasslider.test",
      LEADS_EMAIL_TO: "sales@strasslider.test",
      LEADS_LOG_FILE: "/tmp/gazdream-e2e-leads.jsonl",
      PRICES_FILE: "/tmp/gazdream-e2e-prices.json",
    },
  },
});
