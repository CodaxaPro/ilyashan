import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultFestpreis,
  parseFestpreisInput,
  formatFestpreisEmailLine,
} from "./festpreis";
import { DEFAULT_FENSTER_PRICING, toPricingOverrides, toWartungPricingConfig } from "./pricing-config";

const snapshotPricing = toPricingOverrides(DEFAULT_FENSTER_PRICING);
const snapshotWartung = toWartungPricingConfig(DEFAULT_FENSTER_PRICING);

describe("festpreis helpers", () => {
  it("prefers saved festpreis over snapshot amount", () => {
    assert.equal(
      getDefaultFestpreis({
        festpreis: 130,
        priceSnapshot: {
          priceLabel: "ca. 119 € – 131 € inkl. MwSt.",
          amount: 125,
          min: 119,
          max: 131,
          calculatedSubtotal: 125,
          minimumApplied: false,
          minimumAmount: 69,
          capturedAt: "2026-01-01",
          pricing: snapshotPricing,
          wartungConfig: snapshotWartung,
          wartungPackages: [],
        },
      }),
      130
    );
  });

  it("falls back to snapshot mid amount", () => {
    assert.equal(
      getDefaultFestpreis({
        priceSnapshot: {
          priceLabel: "ca. 119 € – 131 € inkl. MwSt.",
          amount: 125,
          min: 119,
          max: 131,
          calculatedSubtotal: 125,
          minimumApplied: false,
          minimumAmount: 69,
          capturedAt: "2026-01-01",
          pricing: snapshotPricing,
          wartungConfig: snapshotWartung,
          wartungPackages: [],
        },
      }),
      125
    );
  });

  it("parses and rounds festpreis input", () => {
    assert.equal(parseFestpreisInput(125.4), 125);
    assert.equal(parseFestpreisInput("130"), 130);
    assert.equal(parseFestpreisInput(""), undefined);
    assert.equal(parseFestpreisInput(0), undefined);
  });

  it("formats email line with VAT for privat and gewerbe", () => {
    assert.match(formatFestpreisEmailLine(125, "privat"), /inkl\. MwSt/);
    assert.match(formatFestpreisEmailLine(125, "gewerbe"), /Netto/);
    assert.match(formatFestpreisEmailLine(125, "gewerbe"), /Brutto 125\s*€/);
  });
});
