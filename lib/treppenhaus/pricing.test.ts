/**
 * Corporate proof suite — Treppenhausreinigung pricing & Keller sync.
 * Every public rule must have an exact assertion (no soft “about”).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TREPPENHAUS_PRICING,
  allowedKellerTurnus,
  calculateTreppenhausQuote,
  formatEuroFromCents,
  syncKellerTurnus,
  type DirtLevel,
  type StairTurnus,
  type TreppenhausInput,
} from "./pricing";

function base(partial: Partial<TreppenhausInput> = {}): TreppenhausInput {
  return {
    stockwerke: 3,
    wohnungen: 6,
    stairTurnus: "biweekly",
    dirtLevel: "normal",
    keller: false,
    kellerTurnus: "biweekly",
    aufzug: false,
    glasHandlauf: false,
    ...partial,
  };
}

function expectedVisitEuro(input: TreppenhausInput): number {
  const stockwerke = Math.min(12, Math.max(1, Math.round(input.stockwerke)));
  const wohnungen = Math.min(40, Math.max(1, Math.round(input.wohnungen)));
  return (
    TREPPENHAUS_PRICING.baseVisitEuro +
    stockwerke * TREPPENHAUS_PRICING.perStockwerkEuro +
    wohnungen * TREPPENHAUS_PRICING.perWohnungEuro +
    (input.aufzug ? TREPPENHAUS_PRICING.aufzugVisitEuro : 0) +
    (input.glasHandlauf ? TREPPENHAUS_PRICING.glasVisitEuro : 0)
  );
}

describe("treppenhaus/keller-sync contract", () => {
  it("exposes exactly the allowed Keller cadences per stair turnus", () => {
    assert.deepEqual(allowedKellerTurnus("weekly"), ["weekly", "monthly"]);
    assert.deepEqual(allowedKellerTurnus("biweekly"), ["biweekly", "monthly"]);
    assert.deepEqual(allowedKellerTurnus("monthly"), ["monthly"]);
  });

  it("never offers a Keller turnus more frequent than the stair turnus", () => {
    const order: StairTurnus[] = ["monthly", "biweekly", "weekly"];
    const rank = (t: StairTurnus) => order.indexOf(t);
    for (const stair of order) {
      for (const keller of allowedKellerTurnus(stair)) {
        assert.ok(
          rank(keller) <= rank(stair),
          `Keller ${keller} must not outpace stair ${stair}`
        );
      }
    }
  });

  it("always keeps monthly selectable except when stair is already monthly-only set", () => {
    assert.ok(allowedKellerTurnus("weekly").includes("monthly"));
    assert.ok(allowedKellerTurnus("biweekly").includes("monthly"));
    assert.deepEqual(allowedKellerTurnus("monthly"), ["monthly"]);
  });

  it("syncKellerTurnus preserves valid choice and repairs invalid ones", () => {
    assert.equal(syncKellerTurnus("weekly", "weekly"), "weekly");
    assert.equal(syncKellerTurnus("weekly", "monthly"), "monthly");
    assert.equal(syncKellerTurnus("weekly", "biweekly"), "weekly");
    assert.equal(syncKellerTurnus("biweekly", "biweekly"), "biweekly");
    assert.equal(syncKellerTurnus("biweekly", "monthly"), "monthly");
    assert.equal(syncKellerTurnus("biweekly", "weekly"), "biweekly");
    assert.equal(syncKellerTurnus("monthly", "weekly"), "monthly");
    assert.equal(syncKellerTurnus("monthly", "biweekly"), "monthly");
    assert.equal(syncKellerTurnus("monthly", "monthly"), "monthly");
  });

  it("quote engine applies sync when Keller enabled with illegal turnus", () => {
    const q = calculateTreppenhausQuote(
      base({
        stairTurnus: "biweekly",
        keller: true,
        kellerTurnus: "weekly", // illegal — must become biweekly
      })
    );
    assert.equal(q.kellerVisitsPerMonth, 2);
    assert.equal(q.kellerMonthlyNetCents, 12 * 2 * 100);
  });
});

describe("treppenhaus/visit formula exactness", () => {
  it("locks corporate constants (regression guard)", () => {
    assert.equal(TREPPENHAUS_PRICING.baseVisitEuro, 70);
    assert.equal(TREPPENHAUS_PRICING.perStockwerkEuro, 7);
    assert.equal(TREPPENHAUS_PRICING.perWohnungEuro, 3);
    assert.equal(TREPPENHAUS_PRICING.kellerVisitEuro, 12);
    assert.equal(TREPPENHAUS_PRICING.aufzugVisitEuro, 8);
    assert.equal(TREPPENHAUS_PRICING.glasVisitEuro, 10);
    assert.equal(TREPPENHAUS_PRICING.minMonthlyNetEuro, 110);
    assert.equal(TREPPENHAUS_PRICING.vatRate, 0.19);
    assert.equal(TREPPENHAUS_PRICING.weeklyPackageFactor, 0.85);
    assert.deepEqual(TREPPENHAUS_PRICING.dirtFactors, {
      normal: 1,
      medium: 1.15,
      heavy: 1.3,
    });
    assert.deepEqual(TREPPENHAUS_PRICING.visitsPerMonth, {
      weekly: 4,
      biweekly: 2,
      monthly: 1,
    });
  });

  it("computes visit = 70 + floors×7 + WE×3 (+ extras)", () => {
    const cases: Array<[Partial<TreppenhausInput>, number]> = [
      [{ stockwerke: 3, wohnungen: 6 }, 70 + 21 + 18], // 109
      [{ stockwerke: 4, wohnungen: 8 }, 70 + 28 + 24], // 122
      [{ stockwerke: 2, wohnungen: 4 }, 70 + 14 + 12], // 96
      [{ stockwerke: 4, wohnungen: 8, aufzug: true }, 122 + 8],
      [{ stockwerke: 4, wohnungen: 8, glasHandlauf: true }, 122 + 10],
      [{ stockwerke: 4, wohnungen: 8, aufzug: true, glasHandlauf: true }, 122 + 8 + 10],
    ];
    for (const [partial, euro] of cases) {
      const input = base(partial);
      const q = calculateTreppenhausQuote(input);
      assert.equal(q.stairVisitNetCents, Math.round(euro * 100), JSON.stringify(partial));
      assert.equal(expectedVisitEuro(input), euro);
    }
  });
});

describe("treppenhaus/monthly assembly", () => {
  it("biweekly 3/6 = exactly 218,00 € netto", () => {
    const q = calculateTreppenhausQuote(base());
    assert.equal(q.stairVisitsPerMonth, 2);
    assert.equal(q.weeklyPackageFactor, 1);
    assert.equal(q.stairMonthlyNetCents, 21800);
    assert.equal(q.monthlyNetCents, 21800);
    assert.equal(q.vatCents, Math.round(21800 * 0.19));
    assert.equal(q.monthlyGrossCents, q.monthlyNetCents + q.vatCents);
    assert.equal(q.monthlyGrossCents, 25942);
  });

  it("weekly applies 0.85 package factor on stair and weekly Keller", () => {
    const q = calculateTreppenhausQuote(
      base({ stairTurnus: "weekly", keller: true, kellerTurnus: "weekly" })
    );
    const visit = 109;
    const stair = visit * 4 * 0.85;
    const keller = 12 * 4 * 0.85;
    assert.equal(q.weeklyPackageFactor, 0.85);
    assert.equal(q.stairMonthlyNetCents, Math.round(stair * 100));
    assert.equal(q.kellerMonthlyNetCents, Math.round(keller * 100));
    assert.equal(q.monthlyNetCents, Math.round((stair + keller) * 100));
  });

  it("monthly stair is 1 visit without weekly discount (min floor may lift tiny objects)", () => {
    const tiny = calculateTreppenhausQuote(
      base({ stairTurnus: "monthly", kellerTurnus: "monthly" })
    );
    assert.equal(tiny.stairVisitsPerMonth, 1);
    assert.equal(tiny.weeklyPackageFactor, 1);
    assert.equal(tiny.stairMonthlyNetCents, 10900);
    // 109 € raw < 110 € minimum → billed monthly netto is 110 €
    assert.equal(tiny.monthlyNetCents, 11000);

    const mid = calculateTreppenhausQuote(
      base({
        stockwerke: 4,
        wohnungen: 8,
        stairTurnus: "monthly",
        kellerTurnus: "monthly",
      })
    );
    // visit 122 → monthly 122 (above min)
    assert.equal(mid.monthlyNetCents, 12200);
  });

  it("Keller monthly under biweekly stair is cheaper than synced Keller", () => {
    const synced = calculateTreppenhausQuote(
      base({ keller: true, kellerTurnus: "biweekly", stairTurnus: "biweekly" })
    );
    const monthlyKeller = calculateTreppenhausQuote(
      base({ keller: true, kellerTurnus: "monthly", stairTurnus: "biweekly" })
    );
    assert.equal(synced.monthlyNetCents, 21800 + 2400); // 242
    assert.equal(monthlyKeller.monthlyNetCents, 21800 + 1200); // 230
    assert.ok(synced.monthlyNetCents - monthlyKeller.monthlyNetCents === 1200);
  });

  it("Keller off contributes zero even if kellerTurnus is set", () => {
    const q = calculateTreppenhausQuote(
      base({ keller: false, kellerTurnus: "weekly", stairTurnus: "weekly" })
    );
    assert.equal(q.kellerVisitNetCents, 0);
    assert.equal(q.kellerMonthlyNetCents, 0);
    assert.equal(q.kellerVisitsPerMonth, 0);
  });
});

describe("treppenhaus/dirt + minimum + VAT invariants", () => {
  const dirtCases: Array<[DirtLevel, number]> = [
    ["normal", 1],
    ["medium", 1.15],
    ["heavy", 1.3],
  ];

  for (const [level, factor] of dirtCases) {
    it(`dirt ${level} multiplies stair+keller by ${factor}`, () => {
      const q = calculateTreppenhausQuote(
        base({ dirtLevel: level, keller: true, kellerTurnus: "biweekly" })
      );
      const raw = (109 * 2 + 12 * 2) * factor;
      assert.equal(q.dirtFactor, factor);
      assert.equal(q.monthlyNetCents, Math.round(raw * 100));
      assert.equal(q.vatCents, Math.round(q.monthlyNetCents * 0.19));
      assert.equal(q.monthlyGrossCents, q.monthlyNetCents + q.vatCents);
    });
  }

  it("enforces 110 € minimum monthly netto", () => {
    const q = calculateTreppenhausQuote(
      base({
        stockwerke: 1,
        wohnungen: 1,
        stairTurnus: "monthly",
        dirtLevel: "normal",
      })
    );
    // visit 80 → raw 80 < 110
    assert.equal(q.stairMonthlyNetCents, 8000);
    assert.equal(q.monthlyNetCents, 11000);
    assert.equal(q.monthlyGrossCents, 11000 + Math.round(11000 * 0.19));
  });

  it("formats DE currency from cents", () => {
    assert.match(formatEuroFromCents(21800), /218/);
    assert.match(formatEuroFromCents(21800), /€/);
  });
});

describe("treppenhaus/monotonicity + clamp + inspection", () => {
  it("price rises with Stockwerke and Wohnungen (biweekly, normal)", () => {
    const a = calculateTreppenhausQuote(base({ stockwerke: 2, wohnungen: 4 })).monthlyNetCents;
    const b = calculateTreppenhausQuote(base({ stockwerke: 3, wohnungen: 6 })).monthlyNetCents;
    const c = calculateTreppenhausQuote(base({ stockwerke: 4, wohnungen: 8 })).monthlyNetCents;
    const d = calculateTreppenhausQuote(base({ stockwerke: 5, wohnungen: 12 })).monthlyNetCents;
    assert.ok(b > a);
    assert.ok(c > b);
    assert.ok(d > c);
  });

  it("Aufzug and Glas each increase the visit and monthly price", () => {
    const plain = calculateTreppenhausQuote(base());
    const lift = calculateTreppenhausQuote(base({ aufzug: true }));
    const glass = calculateTreppenhausQuote(base({ glasHandlauf: true }));
    assert.equal(lift.stairVisitNetCents - plain.stairVisitNetCents, 800);
    assert.equal(glass.stairVisitNetCents - plain.stairVisitNetCents, 1000);
    assert.ok(lift.monthlyNetCents > plain.monthlyNetCents);
    assert.ok(glass.monthlyNetCents > plain.monthlyNetCents);
  });

  it("clamps absurd inputs into safe bounds", () => {
    const low = calculateTreppenhausQuote(base({ stockwerke: 0, wohnungen: -3 }));
    assert.equal(low.stairVisitNetCents, (70 + 7 + 3) * 100);
    const high = calculateTreppenhausQuote(base({ stockwerke: 99, wohnungen: 99 }));
    // clamp 12 / 40
    assert.equal(high.stairVisitNetCents, (70 + 12 * 7 + 40 * 3) * 100);
  });

  it("needsInspection only above online limits", () => {
    assert.equal(calculateTreppenhausQuote(base({ stockwerke: 8, wohnungen: 16 })).needsInspection, false);
    assert.equal(calculateTreppenhausQuote(base({ stockwerke: 9, wohnungen: 8 })).needsInspection, true);
    assert.equal(calculateTreppenhausQuote(base({ stockwerke: 4, wohnungen: 17 })).needsInspection, true);
  });

  it("frequency order: monthly < biweekly < weekly for same object", () => {
    const monthly = calculateTreppenhausQuote(base({ stairTurnus: "monthly" })).monthlyNetCents;
    const biweekly = calculateTreppenhausQuote(base({ stairTurnus: "biweekly" })).monthlyNetCents;
    const weekly = calculateTreppenhausQuote(base({ stairTurnus: "weekly" })).monthlyNetCents;
    assert.ok(monthly < biweekly);
    assert.ok(biweekly < weekly);
  });
});

describe("treppenhaus/legacy invoice floor (Ilyashan ops)", () => {
  it("new mid objects stay above legacy 55€×2=110€ biweekly floor", () => {
    const mid = calculateTreppenhausQuote(base({ stockwerke: 3, wohnungen: 6, stairTurnus: "biweekly" }));
    assert.ok(mid.monthlyNetCents >= 11000);
    assert.ok(mid.monthlyNetCents >= 20000, "mid biweekly must clearly beat legacy 110€");
  });

  it("4 floors / 8 WE + Keller biweekly is 268,00 € netto", () => {
    // visit 122; ×2 = 244; keller 24 → 268
    const q = calculateTreppenhausQuote(
      base({
        stockwerke: 4,
        wohnungen: 8,
        stairTurnus: "biweekly",
        keller: true,
        kellerTurnus: "biweekly",
      })
    );
    assert.equal(q.stairVisitNetCents, 12200);
    assert.equal(q.monthlyNetCents, 26800);
  });
});
