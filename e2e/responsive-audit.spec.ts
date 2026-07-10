import { expect, test } from "@playwright/test";

const PAGES = [
  { name: "home", path: "/de" },
  { name: "angebot", path: "/de/angebot" },
  { name: "impressum", path: "/de/impressum" },
  { name: "datenschutz", path: "/de/datenschutz" },
];

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14", width: 390, height: 844 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const page of PAGES) {
      test(`${page.name}: no horizontal overflow`, async ({ page: p }) => {
        await p.goto(page.path);
        await p.waitForLoadState("networkidle");

        const overflow = await p.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth - doc.clientWidth;
        });

        expect(overflow, `horizontal overflow on ${page.path}`).toBeLessThanOrEqual(1);
      });
    }

    test("home: mobile menu opens", async ({ page: p }) => {
      await p.goto("/de");
      if (viewport.width >= 1024) return;

      const menuBtn = p.getByRole("button", { name: "Menü öffnen" });
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();
      await expect(p.getByRole("link", { name: "Preise" })).toBeVisible();
    });

    test("angebot: wizard step 1 visible", async ({ page: p }) => {
      await p.goto("/de/angebot");
      await expect(p.getByText("Schritt 1 von 5")).toBeVisible();
      await expect(p.getByTestId("service-privat")).toBeVisible();
    });
  });
}
