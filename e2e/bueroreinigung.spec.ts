import { expect, test } from "@playwright/test";

const PATH = "/de/bueroreinigung/angebot";

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Büroreinigung ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("loads without horizontal overflow", async ({ page }) => {
      await page.goto(PATH);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("cleaning-calculator")).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow on ${viewport.name}`).toBeLessThanOrEqual(1);
    });

    test("UI is German only (no language switch)", async ({ page }) => {
      await page.goto(PATH);
      await expect(page.getByTestId("cleaning-calculator")).toBeVisible();
      await expect(page.getByTestId("cleaning-lang-switch")).toHaveCount(0);
      await expect(page.getByTestId("cleaning-summary")).toContainText(/Angebotsübersicht|Angebot/i);
    });
  });
}

test.describe("Büroreinigung desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("summary + accordion", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByTestId("cleaning-summary")).toBeVisible();
    await expect(page.getByTestId("cleaning-price-net")).toBeVisible();
    await page.getByTestId("cleaning-accordion-4").click();
    await expect(page.getByTestId("cleaning-desks")).toBeVisible();
  });
});

test.describe("Büroreinigung mobile sheet", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dock opens sheet and Escape closes", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByTestId("cleaning-mobile-dock")).toBeVisible();
    await page.getByTestId("cleaning-open-sheet").click();
    await expect(page.getByTestId("cleaning-mobile-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("cleaning-mobile-sheet")).toHaveCount(0);
  });
});
