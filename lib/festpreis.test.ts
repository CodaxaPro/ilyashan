import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultFestpreis,
  parseFestpreisInput,
  formatFestpreisEmailLine,
} from "./festpreis";

describe("festpreis helpers", () => {
  it("prefers saved festpreis over snapshot amount", () => {
    assert.equal(
      getDefaultFestpreis({
        festpreis: 130,
        priceSnapshot: {
          priceLabel: "ca. 119 € – 131 €",
          amount: 125,
          min: 119,
          max: 131,
          calculatedSubtotal: 125,
          minimumApplied: false,
          minimumAmount: 69,
          capturedAt: "2026-01-01",
          pricing: {},
          wartungConfig: { wartungPackages: [], wartungFirstVisitSurchargePercent: 0 },
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
          priceLabel: "ca. 119 € – 131 €",
          amount: 125,
          min: 119,
          max: 131,
          calculatedSubtotal: 125,
          minimumApplied: false,
          minimumAmount: 69,
          capturedAt: "2026-01-01",
          pricing: {},
          wartungConfig: { wartungPackages: [], wartungFirstVisitSurchargePercent: 0 },
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

  it("formats email line", () => {
    assert.match(formatFestpreisEmailLine(125), /Ihr Festpreis: 125\s*€/);
  });
});
