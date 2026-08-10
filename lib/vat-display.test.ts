import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePriceEstimate } from "./pricing";
import { createQuotePricingContext } from "./quote-pricing-context";
import { DEFAULT_FENSTER_PRICING } from "./pricing-config";
import { initialQuoteFormData } from "./quote-form";
import {
  formatEstimateRangeLabel,
  formatFestpreisDisplay,
  formatFestpreisEmailLine,
  resolvePriceAudience,
  splitBrutto,
  VAT_RATE,
} from "./vat-display";

describe("vat-display – economics unchanged", () => {
  it("splitBrutto keeps Endpreis and adds up", () => {
    const split = splitBrutto(125);
    assert.equal(split.brutto, 125);
    assert.equal(Math.round((split.netto + split.mwst) * 100), 12500);
    assert.equal(split.rate, VAT_RATE);
  });

  it("does not change calculatePriceEstimate amounts", () => {
    const ctx = createQuotePricingContext(DEFAULT_FENSTER_PRICING);
    const data = {
      ...initialQuoteFormData,
      services: ["privat" as const],
      objectType: "haus" as const,
      windowCount: 17,
      floorLevel: "og2" as const,
      elevator: "nein" as const,
      dirtLevel: "normal" as const,
      cleaningSide: "innen_aussen" as const,
      withFrame: true,
      windowSills: true,
    };
    const before = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig)!;
    const again = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig)!;
    assert.equal(before.amount, again.amount);
    assert.equal(before.min, again.min);
    assert.equal(before.max, again.max);
    // Display uses same brutto
    const label = formatEstimateRangeLabel(before.min, before.max, "privat");
    assert.match(label, /inkl\. MwSt/);
    assert.match(label, new RegExp(String(before.min)));
  });

  it("resolves audience from services/objectType", () => {
    assert.equal(resolvePriceAudience({ services: ["privat"] }), "privat");
    assert.equal(resolvePriceAudience({ services: ["gewerbe"] }), "gewerbe");
    assert.equal(resolvePriceAudience({ services: ["privat"], objectType: "gewerbe" }), "gewerbe");
  });

  it("formats gewerbe with netto + brutto without changing brutto", () => {
    const display = formatFestpreisDisplay(125, "gewerbe");
    assert.match(display, /Netto/);
    assert.match(display, /zzgl\./);
    assert.match(display, /Brutto 125\s*€/);
    const line = formatFestpreisEmailLine(125, "privat");
    assert.match(line, /inkl\. MwSt/);
    assert.doesNotMatch(line, /Netto/);
  });
});
