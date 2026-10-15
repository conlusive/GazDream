import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "admin", password: "E2e-Admin-Pass-1" };
const MANAGER = { email: "manager@strasslider.test", password: "Manager-Pass-2026", name: "Anna Manager" };

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
}

/** Signs in and waits until the dashboard is actually shown (the sign-in finishes with a redirect). */
async function signInOk(page: Page, email: string, password: string) {
  await signIn(page, email, password);
  await expect(page.getByRole("heading", { name: /Вітаємо/ })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("a visitor request lands in the admin and can be handled", async ({ page, request }) => {
  // A real request from the public site.
  const res = await request.post("/api/lead", {
    data: { name: "Jan Admin-Test", contact: "jan.test@example.pl", message: "Pytanie o PUT-4", model: "PUT-4", lang: "pl", page: "/pl/contact", source: "contact" },
  });
  expect(res.ok()).toBe(true);
  const quick = await request.post("/api/lead", { data: { name: "Quick Person", contact: "+48 600 100 200", message: "Oferta na kocioł", lang: "de", page: "/de", source: "quick" } });
  expect(quick.ok()).toBe(true);

  // Wrong password is refused, no session is created.
  await signIn(page, "admin", "definitely-wrong-1");
  await expect(page.locator('p[role="alert"]')).toContainText("Невірний");

  // First run: the environment admin is created on first successful login.
  await expect(page.getByText("Це перший запуск")).toBeVisible();
  await signIn(page, ADMIN.email, ADMIN.password);
  await expect(page.getByRole("heading", { name: /Вітаємо/ })).toBeVisible();
  await expect(page.getByText("Нові заявки").first()).toBeVisible();

  // List, search and filters.
  await page.getByRole("link", { name: "Заявки", exact: true }).click();
  await expect(page.getByRole("link", { name: "Jan Admin-Test" })).toBeVisible();
  await page.getByLabel("Пошук", { exact: true }).fill("PUT-4");
  await page.getByRole("button", { name: "Шукати" }).click();
  await expect(page.getByRole("link", { name: "Quick Person" })).toHaveCount(0);
  await page.getByRole("link", { name: "Jan Admin-Test" }).click();

  // Lead card: status and notes.
  await expect(page.getByRole("heading", { name: /Заявка №/ })).toBeVisible();
  await page.getByRole("button", { name: "В роботі" }).click();
  await expect(page.getByRole("button", { name: "В роботі" })).toHaveAttribute("aria-pressed", "true");
  await page.getByPlaceholder(/зателефонували/).fill("Зателефонували, передзвонить завтра");
  await page.getByRole("button", { name: "Додати нотатку" }).click();
  await expect(page.getByText("Зателефонували, передзвонить завтра")).toBeVisible();

  // CSV export honours the filter and needs a session.
  const csvRes = await page.request.get("/admin/leads/export?q=PUT-4");
  expect(csvRes.status()).toBe(200);
  const csv = await csvRes.text();
  expect(csv).toContain("Jan Admin-Test");
  expect(csv).not.toContain("Quick Person");
});

test("prices changed in the admin appear on the public calculator at once", async ({ page, browser }) => {
  await signInOk(page, ADMIN.email, ADMIN.password);
  await page.goto("/admin/calculator");
  await page.locator("#EUR_gas").fill("455");
  await page.getByRole("button", { name: "Зберегти ціни" }).click();
  await expect(page.getByRole("status")).toContainText("Ціни збережено");
  await page.getByText("Історія змін цін").click();
  await expect(page.getByText("455 / 70 / 160")).toBeVisible(); // history row

  // Invalid values are rejected and nothing is saved.
  await page.locator("#EUR_gas").fill("0");
  await page.getByRole("button", { name: "Зберегти ціни" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("від 0,01");

  // A different visitor (no session) sees the new price in the EUR calculator.
  const visitor = await browser.newPage();
  await visitor.goto("/en/calculator");
  await expect(visitor.locator("#p-gas")).toHaveValue("455");
  await visitor.close();
});

test("calculator parameters and contacts are editable and reach the site", async ({ page, browser }) => {
  await signInOk(page, ADMIN.email, ADMIN.password);

  await page.goto("/admin/calculator");
  await page.locator('input[name="use_soy_chips"]').fill("4");
  await page.getByRole("button", { name: "Зберегти параметри" }).click();
  await expect(page.getByRole("status")).toContainText("збережено");

  await page.goto("/admin/content");
  await page.locator("#phone").fill("+48 111 222 333");
  await page.getByRole("button", { name: "Зберегти контакти" }).click();
  await expect(page.getByRole("status").first()).toContainText("Контакти збережено");

  // The "add" block is open by default while there are no testimonials, collapsed afterwards.
  const addBlock = page.locator("details", { hasText: "+ Додати відгук" });
  if (!(await addBlock.evaluate((el) => (el as HTMLDetailsElement).open))) await addBlock.locator("summary").click();
  await page.locator("#q-new").fill("Piec działa świetnie od dwóch sezonów.");
  await page.locator("#a-new").fill("Jan K., rolnik");
  await page.locator("#g-new").selectOption("pl");
  await page.getByRole("button", { name: "Додати відгук" }).click();
  await expect(page.getByRole("status").last()).toContainText("додано");

  const visitor = await browser.newPage();
  await visitor.goto("/pl/contact");
  await expect(visitor.getByText("+48 111 222 333").first()).toBeVisible();
  await visitor.goto("/pl");
  await expect(visitor.getByText("Piec działa świetnie")).toBeVisible();
  await visitor.goto("/en");
  await expect(visitor.getByText("Piec działa świetnie")).toHaveCount(0); // Polish-only testimonial
  await visitor.close();
});

test("a manager sees only leads, an admin sees everything, and access is enforced", async ({ page, browser }) => {
  await signInOk(page, ADMIN.email, ADMIN.password);
  await page.goto("/admin/users");
  await page.locator("#u-name").fill(MANAGER.name);
  await page.locator("#u-email").fill(MANAGER.email);
  await page.locator("#u-pass").fill("onlyletters");
  await page.getByRole("button", { name: "Створити" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("літери та цифри");
  await page.locator("#u-pass").fill(MANAGER.password);
  await page.getByRole("button", { name: "Створити" }).click();
  await expect(page.getByRole("status")).toContainText("створено");

  // Manager session in a separate browser context.
  const ctx = await browser.newContext();
  const m = await ctx.newPage();
  await signIn(m, MANAGER.email, MANAGER.password);
  await expect(m.getByRole("heading", { name: /Вітаємо, Anna Manager/ })).toBeVisible();
  const nav = m.getByRole("navigation", { name: "Розділи адмінки" });
  await expect(nav.getByRole("link", { name: "Заявки" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Калькулятор" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Користувачі" })).toHaveCount(0);

  // Direct URLs of admin-only pages bounce back to the dashboard.
  for (const path of ["/admin/prices", "/admin/users", "/admin/calculator", "/admin/content", "/admin/log"]) {
    await m.goto(path);
    await expect(m.getByRole("heading", { name: /Вітаємо/ })).toBeVisible();
  }
  // Managers can work with leads but cannot delete them.
  await m.goto("/admin/leads");
  await m.getByRole("link", { name: "Quick Person" }).click();
  await expect(m.getByRole("button", { name: "Видалити заявку назавжди" })).toHaveCount(0);

  // Without a session nothing is reachable.
  const anon = await browser.newContext();
  const a = await anon.newPage();
  await a.goto("/admin/leads");
  await expect(a.getByRole("button", { name: "Увійти" })).toBeVisible();
  expect((await anon.request.get("/admin/leads/export")).status()).toBe(401);

  // Deactivating the manager ends their access immediately.
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Вимкнути доступ" }).click();
  await m.reload();
  await expect(m.getByRole("button", { name: "Увійти" })).toBeVisible();

  // The audit log recorded the changes.
  await page.goto("/admin/log");
  await expect(page.getByText("Змінено ціни").first()).toBeVisible();
  await expect(page.getByText("Створено користувача").first()).toBeVisible();

  await ctx.close();
  await anon.close();
});

test("admin panel pages have no detectable accessibility violations", async ({ page }) => {
  await signInOk(page, ADMIN.email, ADMIN.password);
  for (const path of ["/admin", "/admin/leads", "/admin/calculator", "/admin/content", "/admin/users", "/admin/log", "/admin/account"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map((v) => `${path} ${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.target.join(" ")}`);
    expect(summary).toEqual([]);
  }
});

test("brute-force protection locks the login after repeated failures", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  for (let i = 0; i < 5; i++) await signIn(page, "victim@strasslider.test", `wrong-password-${i}1`);
  await signIn(page, "victim@strasslider.test", "wrong-password-final1");
  await expect(page.locator('p[role="alert"]')).toContainText("Забагато");
  await ctx.close();
});
