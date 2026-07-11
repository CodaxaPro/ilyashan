import { expect, test, type Page } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "e2e-playwright-admin";
const CALENDAR = "/admin/calendar";

async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole("button", { name: "Akzeptieren" });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}

async function loginAsAdmin(page: Page) {
  await page.goto(CALENDAR);
  await dismissCookieBanner(page);

  const form = page.getByTestId("admin-login-form");
  const calendarHeading = page.getByRole("heading", { name: "Takvim" });

  await expect(form.or(calendarHeading)).toBeVisible({ timeout: 20_000 });

  if (await form.isVisible()) {
    await page.getByTestId("admin-password").fill(ADMIN_PASSWORD);
    await page.getByTestId("admin-login-submit").click();
    await expect(calendarHeading).toBeVisible({ timeout: 20_000 });
  }
}

test.describe("Admin Takvim", () => {
  test("giriş yapmadan API 401 döner", async ({ request }) => {
    const res = await request.get("/api/admin/appointments");
    expect(res.status()).toBe(401);
  });

  test("takvim sayfası yüklenir ve hafta navigasyonu çalışır", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("heading", { name: "Takvim" })).toBeVisible();

    const prev = page.getByTestId("calendar-prev-week");
    const next = page.getByTestId("calendar-next-week");
    const today = page.getByTestId("calendar-today");

    await expect(prev).toBeVisible();
    await expect(next).toBeVisible();
    await expect(today).toBeVisible();

    const weekLabel = page.getByTestId("calendar-week-label");
    const weekLabelBefore = await weekLabel.textContent();
    await next.click();
    await expect(weekLabel).not.toHaveText(weekLabelBefore ?? "");

    const weekLabelAfter = await weekLabel.textContent();
    await today.click();
    await expect(weekLabel).not.toHaveText(weekLabelAfter ?? "");
  });

  test("6 günlük hafta grid'i gösterilir (Pzt–Cmt)", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText("Pzt").first()).toBeVisible();
    await expect(page.getByText("Cmt").first()).toBeVisible();
    const dayCells = page.locator('[data-testid^="calendar-day-"]');
    await expect(dayCells).toHaveCount(6);
  });

  test("PATCH yetkisiz istek reddedilir", async ({ request }) => {
    const res = await request.patch("/api/admin/appointments/local-test-confirmed", {
      data: { eventDate: "2026-03-15" },
    });
    expect(res.status()).toBe(401);
  });

  test("PATCH geçersiz gövde reddedilir (auth sonrası)", async ({ page }) => {
    await loginAsAdmin(page);

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/admin/appointments/local-missing-confirmed", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return { status: res.status, body: await res.json() };
    });

    if (result.status === 503) {
      expect(result.body.error).toMatch(/KV|depolama/i);
      return;
    }

    expect(result.status).toBe(400);
    expect(result.body.error).toMatch(/eventDate/i);
  });
});
