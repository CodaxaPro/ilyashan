import { expect, test } from "@playwright/test";
import { isTerminE2eReady, seedTerminFixture } from "./helpers/termin";

test.describe("Termin / Meine Anfrage", () => {
  test("token yok → Link unvollständig", async ({ page }) => {
    await page.goto("/termin");
    await expect(page.getByTestId("termin-incomplete")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Link unvollständig" })).toBeVisible();
  });

  test("geçersiz token → Link ungültig", async ({ page, request }) => {
    const res = await request.get("/api/termin/context?token=invalid.token.here");
    expect(res.status()).toBe(401);

    await page.goto("/termin?token=invalid.token.here");
    await expect(page.getByTestId("termin-invalid")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Link ungültig" })).toBeVisible();
  });

  test("vorgeschlagener Termin bestätigen", async ({ page, request }) => {
    const ready = await isTerminE2eReady(request);
    test.skip(!ready, "E2E_MODE + KV required for termin fixtures");

    const fixture = await seedTerminFixture(request, "proposed");
    await page.goto(fixture!.terminPath);
    await expect(page.getByTestId("termin-portal")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("termin-portal-overview")).toBeVisible();
    await expect(page.getByTestId("termin-proposed-section")).toBeVisible();
    await expect(page.getByTestId("termin-proposed-date")).toBeVisible();

    await page.getByTestId("termin-confirm-proposed").click();
    await expect(page.getByTestId("termin-success")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("termin-confirmed-card")).toBeVisible();
  });

  test("Termin selbst wählen (pick slot)", async ({ page, request }) => {
    const ready = await isTerminE2eReady(request);
    test.skip(!ready, "E2E_MODE + KV required for termin fixtures");

    const fixture = await seedTerminFixture(request, "pick_slot");
    await page.goto(fixture!.terminPath);
    await expect(page.getByTestId("termin-pick-slot-section")).toBeVisible({ timeout: 20_000 });

    const firstDate = page.locator("[data-testid^='termin-date-']").first();
    await expect(firstDate).toBeVisible();
    await firstDate.click();

    const firstArrival = page.locator("[data-testid^='termin-arrival-']").first();
    await expect(firstArrival).toBeVisible();
    await firstArrival.click();

    await page.getByTestId("termin-book-slot").click();
    await expect(page.getByTestId("termin-success")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("termin-confirmed-card")).toBeVisible();
  });

  test("bereits gebuchter Termin → nur Anzeige", async ({ page, request }) => {
    const ready = await isTerminE2eReady(request);
    test.skip(!ready, "E2E_MODE + KV required for termin fixtures");

    const fixture = await seedTerminFixture(request, "already_booked");
    await page.goto(fixture!.terminPath);
    await expect(page.getByTestId("termin-confirmed-card")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("termin-confirm-proposed")).toHaveCount(0);
    await expect(page.getByTestId("termin-book-slot")).toHaveCount(0);
    await expect(page.getByTestId("termin-reschedule-toggle")).toBeVisible();
  });

  test("PDF indirme linki vorhanden", async ({ page, request }) => {
    const ready = await isTerminE2eReady(request);
    test.skip(!ready, "E2E_MODE + KV required for termin fixtures");

    const fixture = await seedTerminFixture(request, "pick_slot");
    await page.goto(fixture!.terminPath);
    await expect(page.getByTestId("termin-pdf-download")).toBeVisible({ timeout: 20_000 });

    const pdfRes = await request.get(`/api/termin/pdf?token=${encodeURIComponent(fixture!.token)}`);
    expect(pdfRes.status()).toBe(200);
    expect(pdfRes.headers()["content-type"]).toContain("application/pdf");
  });

  test("Wartung planı görünür ve nur Dienstag seçilebilir", async ({ page, request }) => {
    const ready = await isTerminE2eReady(request);
    test.skip(!ready, "E2E_MODE + KV required for termin fixtures");

    const fixture = await seedTerminFixture(request, "wartung_pick");
    await page.goto(fixture!.terminPath);
    await expect(page.getByTestId("termin-wartung-plan")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("termin-wartung-plan")).toContainText("Vierteljährlich");
    await expect(page.getByTestId("termin-wartung-plan")).toContainText("Dienstag");

    const dateButtons = page.locator("[data-testid^='termin-date-']");
    await expect(dateButtons.first()).toBeVisible();
    const count = await dateButtons.count();
    expect(count).toBeGreaterThan(0);

    let picked = false;
    for (let i = 0; i < count; i++) {
      const testId = await dateButtons.nth(i).getAttribute("data-testid");
      const iso = testId?.replace("termin-date-", "") ?? "";
      const day = new Date(iso + "T12:00:00").getDay();
      expect(day).not.toBe(0);
      if (day === 2) {
        await dateButtons.nth(i).click();
        picked = true;
        break;
      }
    }
    expect(picked).toBe(true);

    const firstArrival = page.locator("[data-testid^='termin-arrival-']").first();
    await expect(firstArrival).toBeVisible();
    await firstArrival.click();
    await page.getByTestId("termin-book-slot").click();
    await expect(page.getByTestId("termin-success")).toBeVisible({ timeout: 15_000 });
  });

  test("unauthorized fixture API", async ({ request }) => {
    const res = await request.post("/api/e2e/termin-fixture", {
      data: { scenario: "pick_slot" },
    });
    expect([401, 404]).toContain(res.status());
  });
});

test.describe("Termin API auth", () => {
  test("book without token → 401", async ({ request }) => {
    const res = await request.post("/api/termin/book", {
      data: { action: "pick_slot", date: "2026-12-01" },
    });
    expect(res.status()).toBe(401);
  });
});
