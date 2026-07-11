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
    await dismissCookieBanner(page);
    await page.getByTestId("admin-login-submit").click({ force: true });
    await expect(calendarHeading).toBeVisible({ timeout: 20_000 });
  }
}

test.describe("Admin Takvim v2", () => {
  test("giriş yapmadan API 401 döner", async ({ request }) => {
    const res = await request.get("/api/admin/appointments");
    expect(res.status()).toBe(401);
    const upcoming = await request.get("/api/admin/appointments/upcoming");
    expect(upcoming.status()).toBe(401);
  });

  test("hafta görünümü ve navigasyon", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId("calendar-week-view")).toBeVisible();
    await expect(page.getByTestId("calendar-view-week")).toBeVisible();
    await expect(page.getByTestId("calendar-upcoming-panel").or(page.getByTestId("calendar-upcoming-empty"))).toBeVisible();
    await expect(page.getByTestId("calendar-stats-bar")).toBeVisible();
    await expect(page.getByTestId("calendar-filters")).toBeVisible();

    const period = page.getByTestId("calendar-period-label");
    const before = await period.textContent();
    await page.getByTestId("calendar-next").click();
    await expect(period).not.toHaveText(before ?? "");
    await page.getByTestId("calendar-today").click();
  });

  test("ay görünümü ve ay/yıl seçici", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId("calendar-view-month").click();
    await expect(page.getByTestId("calendar-month-view")).toBeVisible();
    await expect(page.getByTestId("calendar-month-picker")).toBeVisible();

    await page.getByTestId("calendar-month-picker").selectOption("2026-03");
    await expect(page.getByTestId("calendar-period-label")).toContainText("Mart 2026");
  });

  test("liste görünümü", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId("calendar-view-agenda").click();
    await expect(
      page.getByTestId("calendar-agenda-view").or(page.getByTestId("calendar-agenda-empty"))
    ).toBeVisible();
  });

  test("filtre alanları çalışır", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId("calendar-filter-search").fill("test-xyz-not-found");
    await page.waitForTimeout(500);
    await expect(page.getByTestId("calendar-stats-bar")).toBeVisible();
  });

  test("PATCH yetkisiz reddedilir", async ({ request }) => {
    const res = await request.patch("/api/admin/appointments/local-test-confirmed", {
      data: { eventDate: "2026-03-15" },
    });
    expect(res.status()).toBe(401);
  });

  test("ICS export yetkisiz reddedilir", async ({ request }) => {
    const res = await request.get("/api/admin/appointments/export");
    expect(res.status()).toBe(401);
  });

  test("ICS feed token olmadan reddedilir", async ({ request }) => {
    const res = await request.get("/api/calendar/feed");
    expect(res.status()).toBe(401);
  });

  test("export panel görünür", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId("calendar-export-panel")).toBeVisible();
    await expect(page.getByTestId("calendar-export-ics")).toBeVisible();
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
