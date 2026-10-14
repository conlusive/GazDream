import { expect, test } from "@playwright/test";
import { startMailSink } from "./mail-sink";

const SMTP_PORT = 2599;
let sink: Awaited<ReturnType<typeof startMailSink>>;

test.beforeAll(async () => {
  sink = await startMailSink(SMTP_PORT);
});
test.afterAll(async () => {
  await sink.close();
});

const waitForMail = async (predicate: (subject: string, to: string) => boolean) => {
  await expect.poll(() => sink.mails.some((m) => predicate(m.subject, m.to)), { timeout: 15_000 }).toBe(true);
};

test("home -> calculator carries the volume, then a request reaches the sales mailbox", async ({ page }) => {
  await page.goto("/pl");

  // Hero card: pick 20 000 t and see the savings update.
  const savings = page.locator("aside [aria-live]");
  const before = await savings.textContent();
  await page.getByRole("button", { name: "20 000", exact: true }).click();
  await expect(savings).not.toHaveText(before ?? "");

  // The chosen volume is carried into the full calculator.
  await page.locator("aside").getByRole("link", { name: /Policz dla swojego gospodarstwa/ }).click();
  await expect(page).toHaveURL(/\/pl\/calculator$/);
  await expect(page.locator("#t-1")).toHaveValue("20000");
  await expect(page.getByText(/Na zrębki zaoszczędzisz/).first()).toBeVisible();

  // Continue to the contact form with the calculation attached, and submit it.
  await page.getByRole("link", { name: /Otrzymaj ofertę na kocioł/ }).click();
  await expect(page).toHaveURL(/\/pl\/contact\?calc=/);
  await page.locator("#name").fill("Anna Nowak");
  await page.locator("#contact").fill("anna@example.pl");
  await page.locator("#message").fill("Proszę o ofertę");
  await page.getByRole("button", { name: "Wyślij zapytanie" }).click();
  await expect(page.getByRole("status")).toContainText("Dziękujemy");

  await waitForMail((subject) => subject.includes("Nowe zapytanie: Anna Nowak"));
  const mail = sink.mails.find((m) => m.subject.includes("Anna Nowak"));
  expect(mail?.to).toBe("sales@strasslider.test");
  expect(mail?.body).toContain("Kukurydza");
  expect(mail?.body).toContain("anna@example.pl");
});

test("the calculator e-mails the result to the visitor in their language", async ({ page }) => {
  await page.goto("/de/calculator");
  await page.locator("#boiler").fill("60000");
  await page.getByPlaceholder("Ihre E-Mail-Adresse").fill("jan@kunde.de");

  // Consent is required: without it the browser blocks the submit.
  await page.getByRole("button", { name: "Senden", exact: true }).click();
  await expect(page.getByRole("status")).toHaveCount(0);

  await page.getByRole("checkbox").last().check();
  await page.getByRole("button", { name: "Senden", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Gesendet");

  await waitForMail((subject, to) => subject.includes("Bericht") && to === "jan@kunde.de");
  const mail = sink.mails.find((m) => m.to === "jan@kunde.de");
  expect(mail?.body).toContain("Amortisation des Kessels");
});

test("language switch keeps the page and remembers the choice", async ({ page }) => {
  await page.goto("/pl/faq");
  await page.getByRole("link", { name: "EN", exact: true }).first().click();
  await expect(page).toHaveURL(/\/en\/faq$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Frequently asked");
  const cookies = await page.context().cookies();
  expect(cookies.find((c) => c.name === "gd_lang")?.value).toBe("en");
});

test("mobile menu opens, navigates and closes itself", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await page.getByRole("button", { name: "Menu" }).or(page.locator("header summary")).first().click();
  await page.getByRole("link", { name: "FAQ", exact: true }).last().click();
  await expect(page).toHaveURL(/\/en\/faq$/);
  await expect(page.locator("header details")).not.toHaveAttribute("open", "");
});

test("SEO basics: canonical, hreflang, sitemap and robots", async ({ page, request }) => {
  await page.goto("/en/boilers");
  await expect(page).toHaveTitle(/PUT heat generators \| Eco Straßmayr Energy/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/boilers$/);
  await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveCount(1);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/pl/privacy");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
});
