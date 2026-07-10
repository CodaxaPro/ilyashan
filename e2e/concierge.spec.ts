import { test, expect } from "@playwright/test";

test.describe("Concierge Assistent", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de");
    await page.evaluate(() => localStorage.setItem("ilyashan-cookie-consent", "rejected"));
    await page.reload();
  });

  test("öffnet Panel und zeigt Begrüßung", async ({ page }) => {
    await page.getByTestId("concierge-toggle").click();
    await expect(page.getByTestId("concierge-panel")).toBeVisible();
    await expect(page.getByText(/Ilyashan Assistent/i).first()).toBeVisible();
    await expect(page.getByText(/Live-Preisschätzung|Fensterreinigung/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("beantwortet Preisfrage mit Euro-Betrag und Lead-Formular", async ({ page }) => {
    await page.getByTestId("concierge-toggle").click();
    await page.getByTestId("concierge-input").fill("10 Flügel, 2. Stock, Baesweiler");
    await page.getByTestId("concierge-send").click();
    await expect(page.getByText(/€/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("concierge-lead-form")).toBeVisible();
    await expect(page.getByText(/WhatsApp mit Kalkulation/i)).toBeVisible();
  });

  test("lehnt Off-Topic ab", async ({ page }) => {
    await page.getByTestId("concierge-toggle").click();
    await page.getByTestId("concierge-input").fill("Wie wird das Wetter morgen?");
    await page.getByTestId("concierge-send").click();
    await expect(page.getByText(/Fensterreinigung/i).last()).toBeVisible({ timeout: 10000 });
  });

  test("Quick Reply für Leistungen", async ({ page }) => {
    await page.getByTestId("concierge-toggle").click();
    await expect(page.getByRole("button", { name: /Leistungen/i }).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Welche Leistungen/i }).click();
    await expect(page.getByText(/Privathaushalt/i).last()).toBeVisible({ timeout: 10000 });
  });
});
