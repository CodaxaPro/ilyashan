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
  quoteServices,
} from "./quote-form";
import { calculatePriceEstimate } from "./pricing";
import { initialQuoteFormData } from "./quote-form";
import { siteConfig } from "./config";
import {
  formatMinimumWohnungHint,
  formatMinimumWohnungScopeHint,
  formatPrivatHomeServiceDescription,
  formatPrivatQuoteServiceDescription,
} from "./pricing-display";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

  it("extraPriceHints match flat extras + canopy", () => {
    for (const key of ["skylights", "flyScreens", "canopy", "narrowStairs"] as const) {
      assert.ok(extraPriceHints[key], `UI-Hint fehlt für ${key}`);
    }
    assert.match(extraPriceHints.flyScreens, /12,00/);
    assert.match(extraPriceHints.skylights, /18,00/);
    assert.match(extraPriceHints.skylights, /Stück/);
    assert.match(extraPriceHints.flyScreens, /Stück/);
    assert.match(extraPriceHints.canopy, /8,00/);
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

  it("49 € Scope: Homepage ≡ Wizard ≡ Paket (Mindestauftrag, kein falsches einseitig/innen+außen)", () => {
    const privatHome = siteConfig.services.find((s) => s.id === "privat")!;
    const privatQuote = quoteServices.find((s) => s.id === "privat")!;
    const privatPkg = JSON.parse(
      readFileSync(join(process.cwd(), "content/packages/privat.json"), "utf8")
    ) as { includes: { items: string[] }; faq: { a: string }[] };

    assert.equal(privatHome.description, formatPrivatHomeServiceDescription());
    assert.equal(privatQuote.description, formatPrivatQuoteServiceDescription());
    assert.equal(privatQuote.priceHint, formatMinimumWohnungHint(P.minimumWohnung));

    for (const text of [
      privatHome.description,
      privatQuote.description,
      privatQuote.priceHint,
      formatMinimumWohnungScopeHint(),
      ...privatPkg.includes.items,
      privatPkg.faq[0].a,
    ]) {
      assert.doesNotMatch(text, /einseitig/i);
      assert.doesNotMatch(text, /streifenfrei innen und außen/i);
    }

    assert.match(privatHome.description, /Mindestauftrag/);
    assert.match(privatHome.description, /[Uu]mfang/);
    assert.match(privatQuote.description, /[Uu]mfang/);
    assert.match(privatQuote.priceHint, /Mindestauftrag/);
    assert.ok(
      privatPkg.includes.items.some((i) => /Mindestauftrag Wohnung ab 49/.test(i))
    );
    assert.ok(
      privatPkg.includes.items.some((i) => /[Uu]mfang.*Wizard/i.test(i))
    );
  });
});
