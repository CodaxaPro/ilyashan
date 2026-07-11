/**
 * Mathematical audit: engine output must match independent reference formula,
 * research constants, and UI multiplier hints – corporate pricing proof suite.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePriceEstimate } from "./pricing";
import { referencePriceBreakdown } from "./pricing-reference";
import {
  RECOMMENDED_PRICING as P,
  SERVICE_RESEARCH,
  OBJECT_RESEARCH,
  CLEANING_SIDE_RESEARCH,
  DIRT_LEVEL_RESEARCH,
  EXTRAS_RESEARCH,
  RESEARCH_META,
} from "./pricing-market-research";
import {
  cleaningSideHints,
  dirtLevelHints,
  extraPriceHints,
  initialQuoteFormData,
  type CleaningSide,
  type DirtLevel,
  type ElevatorOption,
  type FloorLevel,
  type QuoteFormData,
} from "./quote-form";
import { toWartungPricingConfig, DEFAULT_FENSTER_PRICING } from "./pricing-config";
import { calculateWartungBreakdown } from "./wartung-pricing";
import { DEFAULT_WARTUNG_PACKAGES } from "./wartung-packages";

const wartungConfig = toWartungPricingConfig(DEFAULT_FENSTER_PRICING);

function base(overrides: Partial<QuoteFormData> = {}): QuoteFormData {
  return {
    ...initialQuoteFormData,
    services: ["privat"],
    objectType: "wohnung",
    floorLevel: "eg",
    elevator: "ja",
    windowCount: 12,
    dirtLevel: "normal",
    cleaningSide: "innen_aussen",
    roomHeight: 2.5,
    ...overrides,
  };
}

function assertEuro(actual: number, expected: number, message?: string) {
  assert.ok(Math.abs(actual - expected) < 1e-6, message ?? `${actual} ≈ ${expected}`);
}

function parseMultiplierHint(hint: string): number {
  const match = hint.match(/×([\d,]+)/);
  assert.ok(match, `Kein Multiplikator in "${hint}"`);
  return Number.parseFloat(match[1].replace(",", "."));
}

function parseEuroPerFluegel(hint: string): number {
  const match = hint.match(/\+([\d,]+)\s*€\/Flügel/);
  assert.ok(match, `Kein €/Flügel in "${hint}"`);
  return Number.parseFloat(match[1].replace(",", "."));
}

function sumBreakdownBeforeMinimum(
  breakdown: { label: string; amount: number }[],
  includeMinimumLine = false
) {
  return breakdown
    .filter((line) => {
      if (line.label.includes("Wartungsvertrag")) return false;
      if (line.label.includes("Jahresersparnis")) return false;
      if (!includeMinimumLine && line.label === "Mindestauftragswert") return false;
      return true;
    })
    .reduce((sum, line) => sum + line.amount, 0);
}

describe("Pricing proof – Forschung ↔ Engine Konstanten", () => {
  it("RECOMMENDED_PRICING entspricht SERVICE_RESEARCH Empfehlungen", () => {
    assert.equal(P.basePerFluegel, SERVICE_RESEARCH.privat.recommended);
    assert.equal(P.minimumWohnung, SERVICE_RESEARCH.privat.minJobWohnung);
    assert.equal(P.minimumHaus, SERVICE_RESEARCH.privat.minJobHaus);
    assert.equal(P.minimumGewerbe, SERVICE_RESEARCH.gewerbe.minJob);
    assert.equal(P.gewerbePerSqm, SERVICE_RESEARCH.gewerbe.recommended);
    assert.equal(P.solarPerSqm, SERVICE_RESEARCH.solar.recommended);
    assert.equal(P.solarMin, SERVICE_RESEARCH.solar.minJob);
    assert.equal(P.wintergartenPerSqm, SERVICE_RESEARCH.wintergarten.recommended);
    assert.equal(P.wintergartenMin, SERVICE_RESEARCH.wintergarten.minJob);
    assert.equal(P.wartungDiscount, SERVICE_RESEARCH.wartung.recommended);
    assert.equal(P.wartungMinMonthly, SERVICE_RESEARCH.wartung.minMonthlyPrivat);
  });

  it("jede Forschungs-Option hat ≥20 Quellen", () => {
    assert.ok(RESEARCH_META.minSourcesPerOption >= 20);
    for (const key of Object.keys(CLEANING_SIDE_RESEARCH) as (keyof typeof CLEANING_SIDE_RESEARCH)[]) {
      assert.ok(CLEANING_SIDE_RESEARCH[key].sourceCount >= 20, `cleaning side ${key}`);
    }
    for (const key of Object.keys(DIRT_LEVEL_RESEARCH) as (keyof typeof DIRT_LEVEL_RESEARCH)[]) {
      assert.ok(DIRT_LEVEL_RESEARCH[key].sourceCount >= 20, `dirt ${key}`);
    }
    for (const key of Object.keys(EXTRAS_RESEARCH) as (keyof typeof EXTRAS_RESEARCH)[]) {
      assert.ok(EXTRAS_RESEARCH[key].sourceCount >= 20, `extra ${key}`);
    }
    assert.ok(OBJECT_RESEARCH.wohnung.sourceCount >= 20);
    assert.ok(OBJECT_RESEARCH.haus.sourceCount >= 20);
  });

  it("Seiten-Multiplikatoren: Forschung = Engine = UI", () => {
    for (const side of Object.keys(P.sideMultipliers) as CleaningSide[]) {
      assert.equal(P.sideMultipliers[side], CLEANING_SIDE_RESEARCH[side].multiplier);
      assert.equal(parseMultiplierHint(cleaningSideHints[side]), P.sideMultipliers[side]);
    }
  });

  it("Verschmutzungs-Multiplikatoren: Forschung = Engine = UI", () => {
    for (const dirt of Object.keys(P.dirtMultipliers) as DirtLevel[]) {
      assert.equal(P.dirtMultipliers[dirt], DIRT_LEVEL_RESEARCH[dirt].multiplier);
      assert.equal(parseMultiplierHint(dirtLevelHints[dirt]), P.dirtMultipliers[dirt]);
    }
  });

  it("Extras €/Flügel: Forschung = Engine = UI", () => {
    for (const key of Object.keys(P.extrasPerFluegel) as (keyof typeof P.extrasPerFluegel)[]) {
      const research = EXTRAS_RESEARCH[key];
      assert.equal(P.extrasPerFluegel[key], research.perFluegel);
      assert.equal(parseEuroPerFluegel(extraPriceHints[key]), P.extrasPerFluegel[key]);
    }
  });
});

describe("Pricing proof – Referenzformel ≡ Engine", () => {
  const scenarios: Partial<QuoteFormData>[] = [
    {},
    { windowCount: 4, objectType: "wohnung" },
    { windowCount: 20, objectType: "haus", floorLevel: "og3", elevator: "nein" },
    { windowCount: 30, services: ["gewerbe"], objectType: "gewerbe" },
    { cleaningSide: "nur_innen", dirtLevel: "extrem", roomHeight: 4.5 },
    { withFrame: true, withFalz: true, muntinWindows: true, windowCount: 15 },
    { includeSolar: true, solarSqm: 80, includeWintergarden: true, wintergardenSqm: 20 },
    { narrowStairs: true, skylights: true, canopy: true, canopySqm: 8 },
    { floorLevel: "og2", elevator: "unbekannt" },
    { floorLevel: "dg", elevator: "nein", dirtLevel: "stark", cleaningSide: "nur_aussen" },
  ];

  for (const patch of scenarios) {
    const label = JSON.stringify(patch);
    it(`Referenz ≡ Engine: ${label}`, () => {
      const data = base(patch);
      const ref = referencePriceBreakdown(data);
      const est = calculatePriceEstimate(data, undefined, wartungConfig);
      assert.ok(est, `Estimate null for ${label}`);

      assert.equal(
        Math.round(ref.calculatedSubtotal * 100) / 100,
        est.calculatedSubtotal,
        "calculatedSubtotal mismatch"
      );
      assert.equal(ref.minimumApplied, est.minimumApplied);
      assert.equal(ref.minimum, est.minimumAmount);

      const engineCoreSum = sumBreakdownBeforeMinimum(est.breakdown);
      assert.equal(
        Math.round(engineCoreSum * 100) / 100,
        est.calculatedSubtotal,
        "breakdown lines must sum to calculatedSubtotal"
      );
    });
  }

  it("exhaustive matrix: alle Seiten × Verschmutzungen × Etagen", () => {
    const sides = Object.keys(P.sideMultipliers) as CleaningSide[];
    const dirts = Object.keys(P.dirtMultipliers) as DirtLevel[];
    const floors = Object.keys(P.floorAccessPercent).filter((f) => f !== "eg") as FloorLevel[];

    for (const cleaningSide of sides) {
      for (const dirtLevel of dirts) {
        for (const floorLevel of floors) {
          const data = base({
            windowCount: 16,
            cleaningSide,
            dirtLevel,
            floorLevel,
            elevator: "nein" as ElevatorOption,
          });
          const ref = referencePriceBreakdown(data);
          const est = calculatePriceEstimate(data, undefined, wartungConfig)!;

          assert.equal(
            Math.round(ref.calculatedSubtotal * 100) / 100,
            est.calculatedSubtotal,
            `${cleaningSide}/${dirtLevel}/${floorLevel}`
          );
        }
      }
    }
  });

  it("Admin-Override basePerFluegel wirkt korrekt durch", () => {
    const data = base({ windowCount: 20 });
    const override = { basePerFluegel: 7.5 };
    const ref = referencePriceBreakdown(data, { ...P, ...override } as typeof P);
    const est = calculatePriceEstimate(data, override, wartungConfig)!;
    assert.equal(est.calculatedSubtotal, ref.calculatedSubtotal);
    assert.equal(est.calculatedSubtotal, 20 * 7.5);
  });
});

describe("Pricing proof – Formel-Schritte einzeln", () => {
  it("Schritt 1: Basis = Flügel × 5 € × Seite × Schmutz", () => {
    const data = base({ windowCount: 10, cleaningSide: "nur_aussen", dirtLevel: "stark" });
    const ref = referencePriceBreakdown(data);
    assert.equal(ref.base, 10 * 5 * 0.65 * 1.25);
    assert.equal(ref.heightSurcharge, 0);
    assert.equal(ref.floorSurcharge, 0);
  });

  it("Schritt 2: Höhe nur auf Basis (nicht auf Extras)", () => {
    const data = base({
      windowCount: 10,
      roomHeight: 3.5,
      withFrame: true,
    });
    const ref = referencePriceBreakdown(data);
    assert.equal(ref.base, 50);
    assertEuro(ref.heightSurcharge, 50 * 0.12);
    assert.equal(ref.extrasTotal, 10);
  });

  it("Schritt 3: Etage auf Basis×Höhe", () => {
    const data = base({
      windowCount: 10,
      roomHeight: 3.5,
      floorLevel: "og2",
      elevator: "nein",
    });
    const ref = referencePriceBreakdown(data);
    const baseWithHeight = ref.base * 1.12;
    assertEuro(ref.floorSurcharge, baseWithHeight * 0.18);
  });

  it("Schritt 6: Mindestauftrag hebt korrekt auf", () => {
    const data = base({ windowCount: 4, objectType: "wohnung" });
    const est = calculatePriceEstimate(data, undefined, wartungConfig)!;
    const ref = referencePriceBreakdown(data);
    assert.equal(ref.minimumApplied, true);
    assert.equal(ref.subtotalAfterMinimum, 49);
    assert.equal(est.amount, 50);
    const minLine = est.breakdown.find((l) => l.label === "Mindestauftragswert");
    assert.ok(minLine);
    assert.equal(
      Math.round((est.calculatedSubtotal + minLine!.amount) * 100) / 100,
      ref.subtotalAfterMinimum
    );
  });
});

describe("Pricing proof – Wartung Mathematik", () => {
  it("Wartung: perVisit × (1−Rabatt) × Besuche / 12, min. minMonthly", () => {
    const perVisit = 100;
    const pkg = DEFAULT_WARTUNG_PACKAGES.find((p) => p.id === "quarterly")!;
    const wartung = calculateWartungBreakdown(perVisit, pkg);

    const expectedPerVisit = perVisit * (1 - pkg.discountPercent);
    const expectedYearly = expectedPerVisit * pkg.visitsPerYear;
    const rawMonthly = expectedYearly / 12;

    assert.equal(wartung.perVisitPrice, expectedPerVisit);
    assert.equal(wartung.yearlyTotal, expectedYearly);
    assert.equal(wartung.yearlySavings, perVisit * pkg.visitsPerYear - expectedYearly);
    assert.equal(wartung.monthlyPrice, Math.round(Math.max(pkg.minMonthly, rawMonthly) / 5) * 5);
  });

  it("Wartung End-to-End: Engine subtotal = Wartung-Eingang", () => {
    const data = base({
      services: ["privat", "wartung"],
      wartungPackageId: "four_weekly",
      windowCount: 20,
    });
    const ref = referencePriceBreakdown(data);
    const est = calculatePriceEstimate(data, undefined, wartungConfig)!;
    const pkg = DEFAULT_WARTUNG_PACKAGES.find((p) => p.id === "four_weekly")!;
    const expected = calculateWartungBreakdown(ref.subtotalAfterMinimum, pkg);

    assert.equal(est.wartung!.monthlyPrice, expected.monthlyPrice);
    assert.equal(est.wartung!.yearlySavings, expected.yearlySavings);
  });
});

describe("Pricing proof – Rundung & Spanne", () => {
  it("amount ist auf 5 € gerundet, Spanne ±5 % (min. 5 €)", () => {
    const est = calculatePriceEstimate(base({ windowCount: 17 }), undefined, wartungConfig)!;
    assert.equal(est.amount % 5, 0);
    const variance = Math.max(5, Math.round(est.amount * 0.05));
    assert.equal(est.min, Math.max(est.minimumAmount, est.amount - variance));
    assert.equal(est.max, est.amount + variance);
  });
});
