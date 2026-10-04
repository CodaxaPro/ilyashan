import { expect, test, type Page } from "@playwright/test";

const PATH = "/de/bueroreinigung/angebot";

async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole("button", { name: "Akzeptieren" });
  try {
    await accept.waitFor({ state: "visible", timeout: 5_000 });
    await accept.click();
    await accept.waitFor({ state: "hidden", timeout: 5_000 });
  } catch {
    // Banner absent or already dismissed.
  }
}

async function openAccordion(page: Page, step: number) {
  const header = page.getByTestId(`cleaning-accordion-${step}`);
  await expect(header).toBeVisible();
  const expanded = await header.getAttribute("aria-expanded");
  if (expanded !== "true") {
    await header.click();
  }
  await expect(header).toHaveAttribute("aria-expanded", "true");
}

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
      await dismissCookieBanner(page);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("cleaning-calculator")).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow on ${viewport.name}`).toBeLessThanOrEqual(1);
    });

    test("UI is German only (no language switch)", async ({ page }) => {
      await page.goto(PATH);
      await dismissCookieBanner(page);
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
    await dismissCookieBanner(page);
    await expect(page.getByTestId("cleaning-summary")).toBeVisible();
    await expect(page.getByTestId("cleaning-price-net")).toBeVisible();
    await expect(page.getByTestId("cleaning-price-month-net")).toBeVisible();
    await expect(page.getByTestId("cleaning-price-month")).toContainText(/Monat|52/i);
    await openAccordion(page, 4);
    await expect(page.getByTestId("cleaning-desks")).toBeVisible();
  });

  test("area change updates price; optional extras increase price", async ({ page }) => {
    await page.goto(PATH);
    await dismissCookieBanner(page);
    const price = page.getByTestId("cleaning-price-net");
    await expect(price).toBeVisible();
    const before = await price.innerText();

    await openAccordion(page, 1);
    const area = page.getByTestId("cleaning-total-area");
    await area.fill("350");
    await area.blur();
    await expect(price).not.toHaveText(before);

    const mid = await price.innerText();
    await openAccordion(page, 7);
    await page.getByText("Aufzug", { exact: true }).click();
    await page.getByText("Empfang detailliert", { exact: true }).click();
    await expect(price).not.toHaveText(mid);
  });

  test("all accordion steps open without error", async ({ page }) => {
    await page.goto(PATH);
    await dismissCookieBanner(page);
    for (const step of [1, 2, 3, 4, 5, 6, 7]) {
      await openAccordion(page, step);
    }
    await page.getByTestId("cleaning-goto-contact").click();
    await expect(page.getByRole("heading", { name: "Kontaktdaten" })).toBeVisible();
  });
});

test.describe("Büroreinigung mobile sheet", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dock opens sheet and Escape closes", async ({ page }) => {
    await page.goto(PATH);
    await dismissCookieBanner(page);
    await expect(page.getByTestId("cleaning-mobile-dock")).toBeVisible();
    await page.getByTestId("cleaning-open-sheet").click();
    await expect(page.getByTestId("cleaning-mobile-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("cleaning-mobile-sheet")).toHaveCount(0);
  });
});
