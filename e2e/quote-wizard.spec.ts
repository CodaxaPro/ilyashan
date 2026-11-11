import { expect, test, type Page } from "@playwright/test";

const ANGEBOT = "/de/angebot";

async function selectPrivatFlow(page: Page) {
  await page.goto(ANGEBOT);
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

/** Desktop + mobile dock both render the same test id — scope to first visible. */
function priceEstimateAmount(page: Page) {
  return page.getByTestId("price-estimate-amount").first();
}

function wartungSummary(page: Page) {
  return page.getByTestId("wartung-summary").first();
}

test.describe("Angebot Wizard – Validierung", () => {
  test("Schritt 1: Weiter ohne Extra-Auswahl freigegeben (Privat-Default)", async ({ page }) => {
    await page.goto(ANGEBOT);
    await expect(page.getByTestId("quote-next")).toBeEnabled();
    await expect(page.getByTestId("service-wartung")).toBeVisible();
  });

  test("Schritt 1: Wartung erfordert Paketwahl", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-wartung").click();
    await expect(page.getByTestId("wartung-plan-selector")).toBeVisible();
    await expect(page.getByTestId("quote-next")).toBeEnabled();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
    await page.getByRole("button", { name: "Ja", exact: true }).click();
    await page.getByTestId("quote-next").click();
    await expect(page.getByTestId("window-count-display")).toBeVisible();
    await expect(wartungSummary(page)).toBeVisible();
  });

  test("Wartung: häufigeres Intervall → höherer Monatspreis", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("service-wartung").click();
    await page.getByTestId("wartung-package-quarterly").click();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
    await page.getByRole("button", { name: "Ja", exact: true }).click();
    await page.getByTestId("quote-next").click();
    await expect(priceEstimateAmount(page)).toBeVisible();
    const priceQuarterly = parsePrice(
      (await priceEstimateAmount(page).textContent()) ?? ""
    );

    await page.getByRole("button", { name: "← Zurück" }).click();
    await page.getByRole("button", { name: "← Zurück" }).click();
    await page.getByTestId("wartung-package-four_weekly").click();
    await page.getByTestId("quote-next").click();
    await page.getByTestId("quote-next").click();
    await expect(priceEstimateAmount(page)).toBeVisible();
    const priceFourWeekly = parsePrice(
      (await priceEstimateAmount(page).textContent()) ?? ""
    );
    expect(priceFourWeekly).toBeGreaterThan(priceQuarterly);
  });

  test("Schritt 2: Etage fehlt → Fehlermeldung", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await expect(page.getByTestId("quote-next")).toBeDisabled();
  });

  test("Rahmen aktiviert → Preiszeile in Kalkulation", async ({ page }) => {
    await selectPrivatFlow(page);
    await page.getByText("Mit Rahmen").click();
    await expect(page.getByTestId("price-breakdown")).toContainText("Rahmen");
  });
});

test.describe("Angebot Wizard – Live-Preis", () => {
  test("Flügel erhöhen → Preis steigt sichtbar", async ({ page }) => {
    await selectPrivatFlow(page);

    const priceEl = priceEstimateAmount(page);
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

  test("Flügel-Info-Modal öffnet und schließt", async ({ page }) => {
    await selectPrivatFlow(page);
    await page.getByTestId("fluegel-info-open").click();
    await expect(page.getByTestId("fluegel-info-modal")).toBeVisible();
    await expect(page.getByTestId("fluegel-info-modal")).toContainText(/Fensterflügel/i);
    await page.getByTestId("fluegel-info-close").click();
    await expect(page.getByTestId("fluegel-info-modal")).toHaveCount(0);
  });

  test("Wintergarten-Anfrageformular: E-Mail-Kanal sichtbar", async ({ page }) => {
    await selectPrivatFlow(page);
    await page.getByTestId("wintergarten-toggle").click();
    await expect(page.getByTestId("wintergarten-channel-email")).toBeVisible();
    await page.getByTestId("wintergarten-channel-whatsapp").click();
    await expect(page.getByTestId("wintergarten-submit-whatsapp")).toBeVisible();
    await page.getByTestId("wintergarten-channel-email").click();
    await expect(page.getByTestId("wintergarten-submit-email")).toBeVisible();
  });

  test("Entfernte Extras (Jalousien/Vordach/Solar/Fliegengitter) fehlen", async ({ page }) => {
    await selectPrivatFlow(page);
    await expect(page.getByText("Jalousien (innenliegend)")).toHaveCount(0);
    await expect(page.getByText("Vordach / Glasdach")).toHaveCount(0);
    await expect(page.getByText("Solaranlagen-Reinigung")).toHaveCount(0);
    await expect(page.getByText("Fliegengitter")).toHaveCount(0);
  });

  test("3. OG ohne Aufzug → Etagen-Zuschlag", async ({ page }) => {
    await page.goto(ANGEBOT);
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

    await expect(priceEstimateAmount(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /Per E-Mail senden/ })).toBeEnabled();
  });

  test("P2: starke Verschmutzung → Foto Pflicht blockiert Absenden", async ({ page }) => {
    await selectPrivatFlow(page);
    await page.getByTestId("dirt-stark").click();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: /In den nächsten 1–2 Wochen/ }).click();
    await page.getByTestId("quote-next").click();

    await page.getByTestId("contact-firstName").fill("Anna");
    await page.getByTestId("contact-lastName").fill("Müller");
    await page.getByTestId("contact-phone").fill("01733828354");
    await page.getByTestId("contact-postalCode").fill("52499");
    await page.getByTestId("contact-city").fill("Baesweiler");
    await page.getByTestId("contact-privacy").check();

    await expect(page.getByTestId("quote-photos")).toBeVisible();
    await expect(page.getByTestId("quote-photos")).toContainText(/Foto/i);
    await expect(page.getByTestId("quote-submit-email")).toBeDisabled();
  });

  test("Gewerbe: Objektart wählbar, Live-Preis = Privat-Formel inkl. MwSt.", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: "Gewerbe", exact: true }).click();
    await expect(page.getByRole("button", { name: "Gewerbe", exact: true })).toHaveClass(/border-primary/);
    await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
    await page.getByRole("button", { name: "Ja", exact: true }).click();
    await page.getByTestId("quote-next").click();

    await expect(page.getByTestId("step3-basis-description")).toContainText(/Flügel/i);
    await expect(page.getByTestId("step3-basis-description")).not.toContainText(/m² Glas/i);
    await expect(priceEstimateAmount(page)).toBeVisible();
    await expect(page.getByTestId("price-estimate-range").first()).toContainText(/inkl\. MwSt/);
    await expect(page.getByTestId("price-estimate-range").first()).not.toContainText(/Netto/);
    await expect(page.getByTestId("price-breakdown").first()).toContainText("Fensterreinigung (Basis)");
  });

  test("Große Scheiben → individuelle Anfrage, kein Live-Preis", async ({ page }) => {
    await selectPrivatFlow(page);
    await page.getByTestId("window-size-large").click();
    await expect(page.getByTestId("window-size-large-hint")).toBeVisible();
    await expect(page.getByTestId("price-estimate-individual").first()).toBeVisible();
    await expect(page.getByTestId("price-estimate-amount")).toHaveCount(0);
    await expect(page.getByTestId("step3-basis-description")).toContainText(/individuell|Foto/i);
    await expect(page.getByTestId("dirt-normal")).not.toContainText(/×/);
    await expect(page.getByText("Innen & Außen")).not.toContainText(/×/);
    await expect(page.getByText("Mit Rahmen")).not.toContainText(/€/);
    await expect(page.getByTestId("dirt-normal")).toBeVisible();
    await expect(page.getByText("Mit Rahmen")).toBeVisible();
  });
});

test.describe("Angebot Wizard – Corporate Kanäle (E-Mail / WhatsApp / Foto)", () => {
  async function goToStep5(page: Page) {
    await selectPrivatFlow(page);
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: /In den nächsten 1–2 Wochen/ }).click();
    await page.getByTestId("quote-next").click();
    await expect(page.getByTestId("contact-firstName")).toBeVisible();
  }

  async function fillContact(page: Page) {
    await page.getByTestId("contact-firstName").fill("Kanal");
    await page.getByTestId("contact-lastName").fill("Test");
    await page.getByTestId("contact-phone").fill("01733828354");
    await page.getByTestId("contact-postalCode").fill("52062");
    await page.getByTestId("contact-city").fill("Aachen");
    await page.getByTestId("contact-privacy").check();
  }

  test("beide Submit-Buttons brandfarben; WA speichert zuerst via API", async ({ page }) => {
    await goToStep5(page);
    await fillContact(page);

    const emailBtn = page.getByTestId("quote-submit-email");
    const waBtn = page.getByTestId("quote-submit-whatsapp");
    await expect(emailBtn).toBeEnabled();
    await expect(waBtn).toBeEnabled();
    await expect(waBtn).toHaveAttribute("type", "button");

    let contactPosts = 0;
    await page.route("**/api/contact", async (route) => {
      contactPosts += 1;
      const body = route.request().postDataJSON() as { photos?: unknown[] };
      expect(Array.isArray(body.photos)).toBeTruthy();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          anfrageNr: "ANG-E2E-WA",
          leadId: "lead_e2e_wa",
          storagePersisted: true,
        }),
      });
    });

    const popupPromise = page.waitForEvent("popup");
    await waBtn.click();
    const popup = await popupPromise;
    // wa.me redirects to api.whatsapp.com/send in Chromium
    await expect(popup).toHaveURL(/whatsapp\.com.*(491733828354|phone=491733828354)/);
    expect(decodeURIComponent(popup.url())).toContain("ANG-E2E-WA");
    expect(contactPosts).toBe(1);
    await expect(page.getByText(/Vielen Dank/i)).toBeVisible();
    await expect(page.getByText(/ANG-E2E-WA/)).toBeVisible();
  });

  test("E-Mail-Kanal: Foto hochladen → POST enthält photos + Success", async ({ page }) => {
    await goToStep5(page);
    await fillContact(page);

    await page.getByTestId("quote-photos-input").setInputFiles("e2e/fixtures/fenster-foto.jpg");
    await expect(page.getByTestId("quote-photos-item-0")).toBeVisible({ timeout: 15_000 });

    let sawPhoto = false;
    await page.route("**/api/contact", async (route) => {
      const body = route.request().postDataJSON() as {
        photos?: { data?: string; type?: string }[];
      };
      sawPhoto = Array.isArray(body.photos) && (body.photos?.length ?? 0) >= 1;
      expect(sawPhoto).toBeTruthy();
      expect(body.photos![0].type).toMatch(/image\//);
      expect(body.photos![0].data!.length).toBeGreaterThan(10);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          anfrageNr: "ANG-E2E-MAIL",
          leadId: "lead_e2e_mail",
          storagePersisted: true,
        }),
      });
    });

    await page.getByTestId("quote-submit-email").click();
    await expect(page.getByText(/Vielen Dank/i)).toBeVisible();
    await expect(page.getByText(/ANG-E2E-MAIL/)).toBeVisible();
    expect(sawPhoto).toBeTruthy();
  });

  test("große Scheiben: Foto Pflicht, dann E-Mail-Kanal ok", async ({ page }) => {
    await selectPrivatFlow(page);
    await page.getByTestId("window-size-large").click();
    await page.getByTestId("quote-next").click();
    await page.getByRole("button", { name: /In den nächsten 1–2 Wochen/ }).click();
    await page.getByTestId("quote-next").click();
    await fillContact(page);

    await expect(page.getByTestId("quote-submit-email")).toBeDisabled();
    await page.getByTestId("quote-photos-input").setInputFiles("e2e/fixtures/fenster-foto.jpg");
    await expect(page.getByTestId("quote-photos-item-0")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("quote-submit-email")).toBeEnabled();

    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, anfrageNr: "ANG-E2E-LARGE", storagePersisted: true }),
      });
    });
    await page.getByTestId("quote-submit-email").click();
    await expect(page.getByText(/ANG-E2E-LARGE/)).toBeVisible();
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

  test("P2: stark dirt ohne Fotos → 400 photos_required", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: {
        quote: {
          services: ["privat"],
          objectType: "wohnung",
          floorLevel: "eg",
          elevator: "ja",
          windowCount: 8,
          dirtLevel: "stark",
          cleaningSide: "innen_aussen",
          scheduleOption: "1-2_wochen",
          firstName: "Anna",
          lastName: "Müller",
          phone: "01733828354",
          postalCode: "52499",
          city: "Baesweiler",
          street: "Teststr.",
          houseNumber: "1",
          privacyAccepted: true,
        },
        photos: [],
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/Foto/i);
  });

  test("P2: große Scheiben ohne Fotos → 400 photos_required", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: {
        quote: {
          services: ["privat"],
          objectType: "wohnung",
          floorLevel: "eg",
          elevator: "ja",
          windowCount: 8,
          windowSize: "large",
          dirtLevel: "normal",
          cleaningSide: "innen_aussen",
          scheduleOption: "1-2_wochen",
          firstName: "Anna",
          lastName: "Müller",
          phone: "01733828354",
          postalCode: "52499",
          city: "Baesweiler",
          street: "Teststr.",
          houseNumber: "1",
          privacyAccepted: true,
        },
        photos: [],
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.error)).toMatch(/Foto/i);
  });
});

test.describe("Angebot Wizard – Scroll hygiene", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("step changes keep wizard below header, not in footer", async ({ page }) => {
    await page.goto(ANGEBOT);
    await page.getByTestId("quote-next").click();

    await page.waitForFunction(() => {
      const el = document.getElementById("quote-wizard");
      if (!el) return false;
      const top = el.getBoundingClientRect().top;
      return top >= 64 && top < window.innerHeight - 80;
    }, undefined, { timeout: 3_000 });

    await page.getByRole("button", { name: "Wohnung", exact: true }).click();
    await page.getByRole("button", { name: "Erdgeschoss (EG)", exact: true }).click();
    await page.getByRole("button", { name: "Ja", exact: true }).click();
    await page.getByTestId("quote-next").click();

    await page.waitForFunction(() => {
      const el = document.getElementById("quote-wizard");
      if (!el) return false;
      const top = el.getBoundingClientRect().top;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const nearFooter = max > 200 && window.scrollY > max - 40;
      return top >= 64 && top < window.innerHeight - 80 && !nearFooter;
    }, undefined, { timeout: 3_000 });
  });
});
