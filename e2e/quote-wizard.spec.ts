import { expect, test, type Page } from "@playwright/test";

const ANGEBOT = "/de/angebot";

async function selectPrivatFlow(page: Page) {
  await page.goto(ANGEBOT);
  await page.getByTestId("service-privat").click();
  await expect(page.getByTestId("quote-next")).toBeEnabled();
  await page.getByTestId("quote-next").click();

  await page.getByRole("button", { name: "Wohnung", exact: true }).click();
  await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
  await page.getByRole("button", { name: "Ja", exact: true }).click();
  await expect(page.getByTestId("quote-next")).toBeEnabled();
  await page.getByTestId("quote-next").click();

  await expect(page.getByTestId("window-count-display")).toBeVisible();
}

/** Parses „ca. 49 €“ / „ca. 1.234 €“ from price-estimate-amount */
function parsePrice(text: string) {
  const match = text.match(/ca\.\s*([\d.]+)/);
  if (!match) return 0;
  return Number(match[1].replace(/\./g, ""));
}

test.describe("Angebot Wizard – Validierung", () => {
  test("Schritt 1: Weiter blockiert ohne Leistung", async ({ page }) => {
    await page.goto(ANGEBOT);
    const next = page.getByTestId("quote-next");
    await expect(next).toBeDisabled();
  });

  test("Schritt 1: nur Wartung ohne Hauptleistung blockiert", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-wartung").click();
    await expect(page.getByTestId("quote-next")).toBeDisabled();
  });

  test("Schritt 1: Wartung + Privat erfordert Paketwahl", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-privat").click();
    await page.getByTestId("service-wartung").click();
    await expect(page.getByTestId("wartung-plan-selector")).toBeVisible();
    await expect(page.getByTestId("quote-next")).toBeEnabled();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
    await page.getByRole("button", { name: "Ja", exact: true }).click();
    await page.getByTestId("quote-next").click();
    await expect(page.getByTestId("window-count-display")).toBeVisible();
    await expect(page.getByTestId("wartung-summary")).toBeVisible();
  });

  test("Wartung: häufigeres Intervall → höherer Monatspreis", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-privat").click();
    await page.getByTestId("service-wartung").click();
    await page.getByTestId("wartung-package-quarterly").click();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
    await page.getByRole("button", { name: "Ja", exact: true }).click();
    await page.getByTestId("quote-next").click();
    await expect(page.getByTestId("price-estimate-amount")).toBeVisible();
    const priceQuarterly = parsePrice(
      (await page.getByTestId("price-estimate-amount").textContent()) ?? ""
    );

    await page.getByRole("button", { name: "← Zurück" }).click();
    await page.getByRole("button", { name: "← Zurück" }).click();
    await page.getByTestId("wartung-package-four_weekly").click();
    await page.getByTestId("quote-next").click();
    await page.getByTestId("quote-next").click();
    await expect(page.getByTestId("price-estimate-amount")).toBeVisible();
    const priceFourWeekly = parsePrice(
      (await page.getByTestId("price-estimate-amount").textContent()) ?? ""
    );
    expect(priceFourWeekly).toBeGreaterThan(priceQuarterly);
  });

  test("Schritt 2: Etage fehlt → Fehlermeldung", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-privat").click();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await expect(page.getByTestId("quote-next")).toBeDisabled();
  });

  test("Schritt 2: Gewerbe-Leistung + Wohnung-Objekt blockiert", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-gewerbe").click();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
    await page.getByRole("button", { name: "Ja", exact: true }).click();
    await expect(page.getByTestId("quote-step-error")).toContainText("Gewerbe");
    await expect(page.getByTestId("quote-next")).toBeDisabled();
  });

  test("Solar aktiviert → Preiszeile in Kalkulation", async ({ page }) => {
    await selectPrivatFlow(page);
    await page.getByText("Solaranlagen-Reinigung").click();
    await expect(page.getByTestId("price-breakdown")).toContainText("Solaranlagen");
  });
});

test.describe("Angebot Wizard – Live-Preis", () => {
  test("Flügel erhöhen → Preis steigt sichtbar", async ({ page }) => {
    await selectPrivatFlow(page);

    const priceEl = page.getByTestId("price-estimate-amount");
    await expect(priceEl).toBeVisible();

    const price8 = parsePrice(await priceEl.textContent() ?? "");
    expect(price8).toBeGreaterThan(0);

    for (let i = 0; i < 12; i++) {
      await page.getByTestId("window-count-increase").click();
    }

    await expect(page.getByTestId("window-count-display")).toContainText("20");

    await expect
      .poll(async () => parsePrice(await priceEl.textContent() ?? ""))
      .toBeGreaterThan(price8);
  });

  test("Nur außen → niedrigerer Basispreis in Kalkulation", async ({ page }) => {
    await selectPrivatFlow(page);

    await page.getByRole("button", { name: /Nur außen/ }).click();
    const breakdown = page.getByTestId("price-breakdown");
    await expect(breakdown).toContainText("0.65");
  });

  test("Stark → höherer Multiplikator in Kalkulation", async ({ page }) => {
    await selectPrivatFlow(page);

    await page.getByTestId("dirt-stark").click();
    await expect(page.getByTestId("price-breakdown")).toContainText("1.25");
  });

  test("Rahmen-Extra erscheint in Kalkulation", async ({ page }) => {
    await selectPrivatFlow(page);

    await page.getByLabel("Mit Rahmen").check();
    await expect(page.getByTestId("price-breakdown")).toContainText("Rahmenreinigung");
  });

  test("3. OG ohne Aufzug → Etagen-Zuschlag", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-privat").click();
    await expect(page.getByTestId("quote-next")).toBeEnabled();
    await page.getByTestId("quote-next").click();

    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await page.getByRole("button", { name: "3. Obergeschoss", exact: true }).click();
    await page.getByRole("button", { name: "Nein", exact: true }).click();
    await expect(page.getByTestId("quote-next")).toBeEnabled();
    await page.getByTestId("quote-next").click();
    await expect(page.getByTestId("window-count-display")).toBeVisible();

    await page.getByTestId("window-count-increase").click();
    await page.getByTestId("window-count-increase").click();
    await page.getByTestId("window-count-increase").click();
    await page.getByTestId("window-count-increase").click();

    await expect(page.getByTestId("price-breakdown")).toContainText("Etagen-Zuschlag");
  });
});

test.describe("Angebot Wizard – Voller Durchlauf", () => {
  test("Privat: Schritt 1–5 ohne API-Fehler", async ({ page }) => {
    await selectPrivatFlow(page);
    await expect(page.getByTestId("quote-next")).toBeEnabled();
    await page.getByTestId("quote-next").click();

    await page.getByRole("button", { name: /In den nächsten 1–2 Wochen/ }).click();
    await expect(page.getByTestId("quote-next")).toBeEnabled();
    await page.getByTestId("quote-next").click();

    await expect(page.getByTestId("contact-firstName")).toBeVisible();
    await page.getByTestId("contact-firstName").fill("Test");
    await page.getByTestId("contact-lastName").fill("Kunde");
    await page.getByTestId("contact-phone").fill("01733828354");
    await page.getByTestId("contact-postalCode").fill("52499");
    await page.getByTestId("contact-city").fill("Baesweiler");
    await page.getByTestId("contact-privacy").check();

    await expect(page.getByTestId("price-estimate-amount")).toBeVisible();
    await expect(page.getByRole("button", { name: /Per E-Mail senden/ })).toBeEnabled();
  });

  test("Gewerbe: Objektart wird synchronisiert", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-gewerbe").click();
    await page.getByTestId("quote-next").click();

    await expect(page.getByRole("button", { name: "Gewerbe", exact: true })).toHaveClass(/border-primary/);
  });
});

test.describe("Angebot Wizard – API", () => {
  test("POST /api/contact mit Quote-Payload validiert", async ({ request }) => {
    const incomplete = await request.post("/api/contact", {
      data: { quote: { services: ["privat"] } },
    });
    expect(incomplete.status()).toBe(400);

    const honeypot = await request.post("/api/contact", {
      data: { website: "spam", quote: {} },
    });
    expect(honeypot.status()).toBe(200);
  });
});
