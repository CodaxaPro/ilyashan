import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_FENSTER_PRICING,
  sanitizeFensterPricingConfig,
  toPricingOverrides,
  toWartungPricingConfig,
} from "./pricing-config";
import { calculatePriceEstimate } from "./pricing";
import { initialQuoteFormData, type QuoteFormData } from "./quote-form";

describe("sanitizeFensterPricingConfig", () => {
  it("clamps invalid values to defaults", () => {
    const config = sanitizeFensterPricingConfig({
      basePerFluegel: 999,
      scheduleMinLeadDays: -5,
    });
    assert.equal(config.basePerFluegel, 25);
    assert.equal(config.scheduleMinLeadDays, 0);
    assert.equal(config.wartungPackages.length, 6);
  });

  it("preserves valid overrides", () => {
    const config = sanitizeFensterPricingConfig({
      basePerFluegel: 6,
      scheduleWeekdaysOnly: true,
    });
    assert.equal(config.basePerFluegel, 6);
    assert.equal(config.scheduleWeekdaysOnly, true);
  });

  it("migrates legacy wartung fields into quarterly package", () => {
    const config = sanitizeFensterPricingConfig({
      wartungDiscount: 0.18,
      wartungVisitsPerYear: 4,
      wartungMinMonthly: 65,
    });
    const quarterly = config.wartungPackages.find((pkg) => pkg.id === "quarterly");
    assert.ok(quarterly);
    assert.equal(quarterly!.discountPercent, 0.18);
    assert.equal(quarterly!.minMonthly, 65);
  });
});

describe("pricing config integration", () => {
  it("applies package-based wartung monthly price", () => {
    const data: QuoteFormData = {
      ...initialQuoteFormData,
      services: ["privat", "wartung"],
      wartungPackageId: "quarterly",
      objectType: "wohnung",
      windowCount: 20,
      floorLevel: "eg",
      elevator: "ja",
      dirtLevel: "normal",
      cleaningSide: "innen_aussen",
      roomHeight: 2.5,
    };

    const config = sanitizeFensterPricingConfig(DEFAULT_FENSTER_PRICING);
    const est = calculatePriceEstimate(
      data,
      toPricingOverrides(config),
      toWartungPricingConfig(config)
    );
    assert.ok(est);
    assert.ok(est!.amount >= 59);
    assert.ok(est!.wartung);
  });
});
