/**
 * Cross-check: RECOMMENDED_PRICING ↔ UI-Hinweise ↔ calculatePriceEstimate
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RECOMMENDED_PRICING as P } from "./pricing-market-research";
import {
  cleaningSideHints,
  dirtLevelHints,
  extraPriceHints,
} from "./quote-form";
import { calculatePriceEstimate } from "./pricing";
import { initialQuoteFormData } from "./quote-form";

describe("Pricing-Konsistenz UI ↔ Engine ↔ Research", () => {
  it("cleaningSideHints match sideMultipliers", () => {
    assert.equal(cleaningSideHints.innen_aussen, "×1,00");
    assert.equal(cleaningSideHints.nur_aussen, "×0,65");
    assert.equal(cleaningSideHints.nur_innen, "×0,45");
    assert.equal(P.sideMultipliers.innen_aussen, 1.0);
    assert.equal(P.sideMultipliers.nur_aussen, 0.65);
    assert.equal(P.sideMultipliers.nur_innen, 0.45);
  });

  it("dirtLevelHints match dirtMultipliers", () => {
    assert.equal(P.dirtMultipliers.leicht, 0.92);
    assert.equal(P.dirtMultipliers.stark, 1.25);
    assert.match(dirtLevelHints.stark, /1,25/);
  });

  it("extraPriceHints match extrasPerFluegel keys", () => {
    for (const key of Object.keys(P.extrasPerFluegel)) {
      assert.ok(extraPriceHints[key], `UI-Hint fehlt für ${key}`);
    }
  });

  it("jeder floorAccessPercent-Wert ist in Engine aktiv", () => {
    for (const floor of Object.keys(P.floorAccessPercent)) {
      if (floor === "eg") continue;
      const data = {
        ...initialQuoteFormData,
        services: ["privat"] as const,
        objectType: "wohnung" as const,
        floorLevel: floor as typeof initialQuoteFormData.floorLevel,
        elevator: "nein" as const,
        windowCount: 20,
      };
      const est = calculatePriceEstimate(data);
      assert.ok(est?.breakdown.some((l) => l.label === "Etagen-Zuschlag"), floor);
    }
  });
});
