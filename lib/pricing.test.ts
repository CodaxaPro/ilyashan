import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculatePriceEstimate } from "./pricing";
import { RECOMMENDED_PRICING as P } from "./pricing-market-research";
import { initialQuoteFormData, type QuoteFormData } from "./quote-form";
import { toWartungPricingConfig, DEFAULT_FENSTER_PRICING } from "./pricing-config";

const wartungConfig = toWartungPricingConfig(DEFAULT_FENSTER_PRICING);

function base(overrides: Partial<QuoteFormData> = {}): QuoteFormData {
  return {
    ...initialQuoteFormData,
    services: ["privat"],
    objectType: "wohnung",
    floorLevel: "eg",
    elevator: "ja",
    windowCount: 20,
    dirtLevel: "normal",
    cleaningSide: "innen_aussen",
    roomHeight: 2.5,
    ...overrides,
  };
}

function breakdownTotal(data: QuoteFormData) {
  const est = calculatePriceEstimate(data, undefined, wartungConfig);
  assert.ok(est);
  return est;
}

describe("calculatePriceEstimate – Multiplikatoren", () => {
  it("liefert null ohne Leistung oder Flügel", () => {
    assert.equal(calculatePriceEstimate({ windowCount: 0, services: [] }), null);
    assert.equal(calculatePriceEstimate({ windowCount: 8, services: [] }), null);
  });

  it("Basis Privat: Flügel × 5 € × 1.0 × 1.0", () => {
    const est = breakdownTotal(base({ windowCount: 20 }));
    const core = est.breakdown.find((l) => l.label.includes("Basis"));
    assert.ok(core);
    assert.equal(core!.amount, 20 * P.basePerFluegel);
    assert.equal(est.amount, 100);
  });

  for (const [side, mul] of Object.entries(P.sideMultipliers)) {
    it(`Reinigungsseite ${side} × ${mul}`, () => {
      const est = breakdownTotal(
        base({
          windowCount: 20,
          cleaningSide: side as QuoteFormData["cleaningSide"],
        })
      );
      const core = est.breakdown.find((l) => l.label.includes("Basis"));
      assert.equal(core!.amount, 20 * P.basePerFluegel * mul);
    });
  }

  for (const [dirt, mul] of Object.entries(P.dirtMultipliers)) {
    it(`Verschmutzung ${dirt} × ${mul}`, () => {
      const est = breakdownTotal(
        base({
          windowCount: 20,
          dirtLevel: dirt as QuoteFormData["dirtLevel"],
        })
      );
      const core = est.breakdown.find((l) => l.label.includes("Basis"));
      assert.equal(core!.amount, 20 * P.basePerFluegel * mul);
    });
  }

  it("Raumhöhe > 3 m: +12 %", () => {
    const est = breakdownTotal(base({ windowCount: 20, roomHeight: 3.5 }));
    const h = est.breakdown.find((l) => l.label === "Raumhöhe-Zuschlag");
    assert.ok(h);
    assert.equal(h!.amount, 20 * P.basePerFluegel * (P.heightMultipliers.above3m - 1));
  });

  it("Raumhöhe > 4 m: +25 %", () => {
    const est = breakdownTotal(base({ windowCount: 20, roomHeight: 4.5 }));
    const h = est.breakdown.find((l) => l.label === "Raumhöhe-Zuschlag");
    assert.ok(h);
    assert.equal(h!.amount, 20 * P.basePerFluegel * (P.heightMultipliers.above4m - 1));
  });

  for (const [floor, pct] of Object.entries(P.floorAccessPercent)) {
    if (floor === "eg") continue;
    it(`Etage ${floor} ohne Aufzug: +${pct * 100}%`, () => {
      const est = breakdownTotal(
        base({
          windowCount: 20,
          floorLevel: floor as QuoteFormData["floorLevel"],
          elevator: "nein",
        })
      );
      const access = est.breakdown.find((l) => l.label === "Etagen-Zuschlag");
      assert.ok(access, `Etagen-Zuschlag fehlt für ${floor}`);
      const core = est.breakdown.find((l) => l.label.includes("Basis"))!.amount;
      assert.equal(access!.amount, core * pct);
    });
  }

  it("Aufzug ja: kein Etagen-Zuschlag", () => {
    const est = breakdownTotal(
      base({ floorLevel: "og3", elevator: "ja" })
    );
    assert.equal(est.breakdown.some((l) => l.label === "Etagen-Zuschlag"), false);
  });

  it("Aufzug unbekannt: 50 % Etagen-Zuschlag", () => {
    const est = breakdownTotal(
      base({ floorLevel: "og2", elevator: "unbekannt" })
    );
    const access = est.breakdown.find((l) => l.label === "Etagen-Zuschlag")!;
    const core = est.breakdown.find((l) => l.label.includes("Basis"))!.amount;
    assert.equal(access.amount, core * P.floorAccessPercent.og2 * P.elevatorUnbekanntFactor);
  });
});

describe("calculatePriceEstimate – Extras & Zusatzleistungen", () => {
  for (const [key, unit] of Object.entries(P.extrasPerFluegel)) {
    it(`Extra ${key}: +${unit} €/Flügel`, () => {
      const est = breakdownTotal(
        base({ windowCount: 10, [key]: true } as Partial<QuoteFormData>)
      );
      const line = est.breakdown.find((l) =>
        l.detail?.includes(`${unit.toFixed(2)} €`)
      );
      assert.ok(line, `Extra-Zeile für ${key}`);
      assert.equal(line!.amount, 10 * unit);
    });
  }

  it("Dachfenster pauschal 12 €", () => {
    const est = breakdownTotal(base({ skylights: true }));
    const line = est.breakdown.find((l) => l.label.includes("Dachfenster"));
    assert.equal(line!.amount, P.extrasFlat.skylights);
  });

  it("Enge Treppe 15 €", () => {
    const est = breakdownTotal(base({ narrowStairs: true }));
    assert.equal(
      est.breakdown.find((l) => l.label === "Enge Treppe")!.amount,
      P.extrasFlat.narrowStairs
    );
  });

  it("Solar m² mit Minimum 99 €", () => {
    const est = breakdownTotal(base({ includeSolar: true, solarSqm: 10 }));
    assert.equal(
      est.breakdown.find((l) => l.label.includes("Solar"))!.amount,
      P.solarMin
    );
    const estLarge = breakdownTotal(base({ includeSolar: true, solarSqm: 80 }));
    assert.equal(
      estLarge.breakdown.find((l) => l.label.includes("Solar"))!.amount,
      80 * P.solarPerSqm
    );
  });

  it("Wintergarten m² mit Minimum 129 €", () => {
    const est = breakdownTotal(base({ includeWintergarden: true, wintergardenSqm: 10 }));
    assert.equal(
      est.breakdown.find((l) => l.label.includes("Wintergarten"))!.amount,
      P.wintergartenMin
    );
  });
});

describe("calculatePriceEstimate – Mindest & Modelle", () => {
  it("Mindest Wohnung 49 €", () => {
    const est = breakdownTotal(base({ windowCount: 4, objectType: "wohnung" }));
    assert.equal(est.minimumApplied, true);
    assert.equal(est.amount, 50);
  });

  it("Mindest Haus 69 €", () => {
    const est = breakdownTotal(base({ windowCount: 8, objectType: "haus" }));
    assert.equal(est.minimumAmount, P.minimumHaus);
    assert.equal(est.amount, 70);
  });

  it("Gewerbe m²-Modell nur bei Leistung Gewerbe", () => {
    const gewerbe = breakdownTotal(
      base({ services: ["gewerbe"], objectType: "gewerbe", windowCount: 30 })
    );
    assert.ok(gewerbe.breakdown.some((l) => l.label.includes("Gewerbefenster")));

    const privatObj = breakdownTotal(
      base({ services: ["privat"], objectType: "gewerbe", windowCount: 30 })
    );
    assert.ok(privatObj.breakdown.some((l) => l.label.includes("Fensterreinigung (Basis)")));
    assert.equal(privatObj.minimumAmount, P.minimumGewerbe);
  });

  it("Wartung: Monatspreis mindestens 59 € (Vierteljährlich)", () => {
    const est = breakdownTotal(
      base({
        services: ["privat", "wartung"],
        wartungPackageId: "quarterly",
        wartungPreferredWeekday: "mo",
        wartungPreferredTimeSlot: "flexibel",
        windowCount: 8,
        objectType: "wohnung",
      })
    );
    assert.ok(est.label.includes("Vierteljährlich"));
    assert.ok(est.amount >= 59);
    assert.ok(est.wartung);
    assert.ok(est.wartung!.yearlySavings > 0);
  });

  it("Wartung: 4-wöchentlich teurer als vierteljährlich pro Monat", () => {
    const quarterly = breakdownTotal(
      base({
        services: ["privat", "wartung"],
        wartungPackageId: "quarterly",
        windowCount: 20,
      })
    );
    const fourWeekly = breakdownTotal(
      base({
        services: ["privat", "wartung"],
        wartungPackageId: "four_weekly",
        windowCount: 20,
      })
    );
    assert.ok(fourWeekly.amount > quarterly.amount);
    assert.ok(fourWeekly.wartung!.yearlySavings > quarterly.wartung!.yearlySavings);
  });
});

describe("calculatePriceEstimate – Preis steigt bei mehr Flügeln", () => {
  it("8 → 20 Flügel: amount steigt", () => {
    const small = breakdownTotal(base({ windowCount: 8 }));
    const large = breakdownTotal(base({ windowCount: 20 }));
    assert.ok(large.amount > small.amount);
  });
});
