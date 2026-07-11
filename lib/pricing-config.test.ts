import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FENSTER_PRICING,
  sanitizeFensterPricingConfig,
  toPricingOverrides,
} from "./pricing-config";
import { calculatePriceEstimate } from "./pricing";
import { initialQuoteFormData, type QuoteFormData } from "./quote-form";

describe("sanitizeFensterPricingConfig", () => {
  it("clamps invalid values to defaults", () => {
    const config = sanitizeFensterPricingConfig({
      basePerFluegel: 999,
      wartungDiscount: 2,
      scheduleMinLeadDays: -5,
    });
    assert.equal(config.basePerFluegel, 25);
    assert.equal(config.wartungDiscount, 0.5);
    assert.equal(config.scheduleMinLeadDays, 0);
  });

  it("preserves valid overrides", () => {
    const config = sanitizeFensterPricingConfig({
      basePerFluegel: 6,
      wartungMinMonthly: 65,
      scheduleWeekdaysOnly: true,
    });
    assert.equal(config.basePerFluegel, 6);
    assert.equal(config.wartungMinMonthly, 65);
    assert.equal(config.scheduleWeekdaysOnly, true);
  });
});

describe("pricing config integration", () => {
  it("applies admin overrides to wartung monthly price", () => {
    const data: QuoteFormData = {
      ...initialQuoteFormData,
      services: ["privat", "wartung"],
      objectType: "wohnung",
      windowCount: 20,
      floorLevel: "eg",
      elevator: "ja",
      dirtLevel: "normal",
      cleaningSide: "innen_aussen",
      roomHeight: 2.5,
    };

    const overrides = toPricingOverrides({
      ...DEFAULT_FENSTER_PRICING,
      wartungDiscount: 0.3,
      wartungVisitsPerYear: 4,
      wartungMinMonthly: 70,
    });

    const est = calculatePriceEstimate(data, overrides);
    assert.ok(est);
    assert.ok(est!.amount >= 70);
    assert.ok(est!.label.includes("Wartungsvertrag"));
  });
});
