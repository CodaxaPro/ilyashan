/**
 * Enterprise proof: Live-Preispolitik (Privat-only + große Scheiben).
 * Guards the product rule: same Flügel formula for everyone; large → no live number.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculatePriceEstimate } from "./pricing";
import { referencePriceBreakdown } from "./pricing-reference";
import { getPriceLabel, buildQuoteTableRows } from "./quote-summary";
import { resolvePriceAudience } from "./vat-display";
import { resolvePriceBasisMode } from "./pricing-display";
import { getWartungAudience } from "./wartung-packages";
import { resolvePhotoIntakeRequirement } from "./photo-intake";
import { captureQuotePriceSnapshot, createQuotePricingContext } from "./quote-pricing-context";
import { DEFAULT_FENSTER_PRICING } from "./pricing-config";
import { initialQuoteFormData, type QuoteFormData } from "./quote-form";
import {
  isLargeWindowQuote,
  LARGE_WINDOW_PRICE_LABEL,
  shouldCalculateLivePrice,
  usesPrivatLivePricing,
} from "./live-pricing-policy";
import { buildWhatsAppQuoteMessage } from "./whatsapp-quote";
import { buildPriceResponse } from "./concierge/pricing-response";

const ctx = createQuotePricingContext(DEFAULT_FENSTER_PRICING);

function quote(overrides: Partial<QuoteFormData> = {}): QuoteFormData {
  return {
    ...initialQuoteFormData,
    services: ["privat"],
    objectType: "wohnung",
    floorLevel: "eg",
    elevator: "ja",
    windowCount: 12,
    windowSize: "standard",
    dirtLevel: "normal",
    cleaningSide: "innen_aussen",
    roomHeight: 2.5,
    ...overrides,
  };
}

describe("Live-Preispolitik – Privat-only invariants", () => {
  it("policy flag is on", () => {
    assert.equal(usesPrivatLivePricing(), true);
  });

  it("audience, basis mode and Wartung audience stay privat for Gewerbe-Label", () => {
    const data = quote({ services: ["gewerbe"], objectType: "gewerbe" });
    assert.equal(resolvePriceAudience(data), "privat");
    assert.equal(resolvePriceBasisMode(data), "privat");
    assert.equal(getWartungAudience(data.services), "privat");
  });

  it("Privat und Gewerbe gleiche Beträge bei gleicher Objektbasis", () => {
    const privat = quote({ services: ["privat"], objectType: "wohnung", windowCount: 16 });
    const gewerbe = quote({
      services: ["gewerbe"],
      objectType: "gewerbe",
      windowCount: 16,
    });
    const estP = calculatePriceEstimate(privat)!;
    const estG = calculatePriceEstimate(gewerbe)!;
    assert.equal(estP.amount, estG.amount);
    assert.equal(estP.calculatedSubtotal, estG.calculatedSubtotal);
    assert.equal(estP.minimumAmount, estG.minimumAmount);
    assert.ok(estP.breakdown.some((l) => l.label === "Fensterreinigung (Basis)"));
    assert.ok(estG.breakdown.some((l) => l.label === "Fensterreinigung (Basis)"));
    assert.ok(!estG.breakdown.some((l) => /Gewerbefenster/i.test(l.label)));
  });

  it("engine ≡ reference für Gewerbe-Label (kein m²-Pfad)", () => {
    const data = quote({
      services: ["gewerbe"],
      objectType: "gewerbe",
      windowCount: 20,
      withFrame: true,
    });
    const est = calculatePriceEstimate(data)!;
    const ref = referencePriceBreakdown(data);
    assert.equal(est.calculatedSubtotal, ref.calculatedSubtotal);
    assert.equal(est.minimumAmount, ref.minimum);
  });

  it("Labels inkl. MwSt. auf allen Oberflächen (Wizard/WhatsApp/Concierge/Snapshot)", () => {
    const data = quote({ services: ["gewerbe"], objectType: "gewerbe", windowCount: 14 });
    assert.match(getPriceLabel(data), /inkl\. MwSt/);
    assert.doesNotMatch(getPriceLabel(data), /Netto/);

    const wa = buildWhatsAppQuoteMessage(data);
    assert.match(wa, /inkl\. MwSt/);
    assert.doesNotMatch(wa, /Netto/);

    const concierge = buildPriceResponse({
      services: ["gewerbe"],
      objectType: "gewerbe",
      windowCount: 14,
      floorLevel: "eg",
    })!;
    assert.match(concierge, /inkl\. MwSt/);
    assert.doesNotMatch(concierge, /Netto/);

    const snap = captureQuotePriceSnapshot(data, ctx)!;
    assert.match(snap.priceLabel, /inkl\. MwSt/);
    assert.doesNotMatch(snap.priceLabel, /Netto/);
  });
});

describe("Live-Preispolitik – große / breite Scheiben", () => {
  it("large → no live calculation, individuelle Label", () => {
    const data = quote({ windowSize: "large", windowCount: 10 });
    assert.equal(isLargeWindowQuote(data), true);
    assert.equal(shouldCalculateLivePrice(data), false);
    assert.equal(calculatePriceEstimate(data), null);
    assert.equal(captureQuotePriceSnapshot(data, ctx), null);
    assert.equal(getPriceLabel(data), LARGE_WINDOW_PRICE_LABEL);
  });

  it("table rows mark Fenstergröße and individuelle Preiszeile", () => {
    const data = quote({ windowSize: "large" });
    const rows = buildQuoteTableRows(data, "ANG-LARGE");
    const sizeRow = rows.find(([k]) => k === "Fenstergröße");
    const priceRow = rows.find(([k]) => /Preis|Schätzung/i.test(k));
    assert.ok(sizeRow);
    assert.match(sizeRow![1], /Größer als normal/);
    assert.ok(priceRow);
    assert.equal(priceRow![1], LARGE_WINDOW_PRICE_LABEL);
  });

  it("large requires photos (fail-closed)", () => {
    const policy = resolvePhotoIntakeRequirement({
      quote: quote({ windowSize: "large" }),
    });
    assert.equal(policy.required, true);
    assert.equal(policy.reason, "window_size");
    assert.match(policy.messageDe, /Foto/i);
  });

  it("standard keeps live price and optional photos", () => {
    const data = quote({ windowSize: "standard" });
    assert.ok(calculatePriceEstimate(data));
    const policy = resolvePhotoIntakeRequirement({ quote: data });
    assert.equal(policy.required, false);
    assert.equal(policy.reason, "optional");
  });
});

describe("Live-Preispolitik – UI wiring proof", () => {
  it("Step3 + PriceEstimateCard expose Fenstergröße / individual path", () => {
    const step3 = readFileSync(
      join(process.cwd(), "components/quote/steps/Step3Details.tsx"),
      "utf8"
    );
    const card = readFileSync(
      join(process.cwd(), "components/quote/PriceEstimateCard.tsx"),
      "utf8"
    );
    const dock = readFileSync(
      join(process.cwd(), "components/quote/PriceEstimateMobileDock.tsx"),
      "utf8"
    );
    assert.match(step3, /window-size-\$\{value\}/);
    assert.match(step3, /window-size-large-hint/);
    assert.match(step3, /formatBasePerFluegelDescription/);
    assert.doesNotMatch(step3, /formatGewerbeBaseDescription/);
    assert.match(card, /price-estimate-individual/);
    assert.match(dock, /isLargeWindowQuote/);
  });
});
