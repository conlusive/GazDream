import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Automated WCAG 2.1 A/AA scan of the key pages (catches contrast, missing names/labels, landmarks).
const PAGES = ["/pl", "/pl/calculator", "/pl/contact", "/en/boilers", "/de/privacy"];

for (const path of PAGES) {
  test(`no detectable accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500); // let entrance animations finish, axe would read half-transparent colours
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(" ")}`);
    expect(summary).toEqual([]);
  });
}
