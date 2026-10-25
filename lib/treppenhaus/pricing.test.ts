import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allowedKellerTurnus,
  calculateTreppenhausQuote,
  syncKellerTurnus,
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

describe("treppenhaus pricing", () => {
  it("syncs Keller options to stair turnus and always allows monthly when not monthly-only", () => {
    assert.deepEqual(allowedKellerTurnus("weekly"), ["weekly", "monthly"]);
    assert.deepEqual(allowedKellerTurnus("biweekly"), ["biweekly", "monthly"]);
    assert.deepEqual(allowedKellerTurnus("monthly"), ["monthly"]);
    assert.equal(syncKellerTurnus("weekly", "biweekly"), "weekly");
    assert.equal(syncKellerTurnus("weekly", "monthly"), "monthly");
    assert.equal(syncKellerTurnus("monthly", "weekly"), "monthly");
  });

  it("prices 3 floors / 6 WE biweekly near ~194 € netto", () => {
    // visit = 70+21+18 = 109; ×2 = 218 — wait, earlier table said 194 with different math
    // sefer 70+3*7+6*3 = 70+21+18 = 109; biweekly ×2 = 218
    const q = calculateTreppenhausQuote(base());
    assert.equal(q.stairVisitNetCents, 10900);
    assert.equal(q.monthlyNetCents, 21800);
    assert.equal(q.stairVisitsPerMonth, 2);
  });

  it("applies weekly package factor 0.85", () => {
    const q = calculateTreppenhausQuote(base({ stairTurnus: "weekly", kellerTurnus: "weekly" }));
    // 109 * 4 * 0.85 = 370.6 → 37060 cents rounded
    assert.equal(q.stairVisitsPerMonth, 4);
    assert.equal(q.monthlyNetCents, Math.round(109 * 4 * 0.85 * 100));
  });

  it("adds Keller at its own turnus", () => {
    const same = calculateTreppenhausQuote(
      base({ keller: true, kellerTurnus: "biweekly", stairTurnus: "biweekly" })
    );
    const monthlyKeller = calculateTreppenhausQuote(
      base({ keller: true, kellerTurnus: "monthly", stairTurnus: "biweekly" })
    );
    // stair 218 + keller 12*2 = 242 vs stair 218 + keller 12*1 = 230
    assert.equal(same.monthlyNetCents, 21800 + 2400);
    assert.equal(monthlyKeller.monthlyNetCents, 21800 + 1200);
    assert.ok(same.monthlyNetCents > monthlyKeller.monthlyNetCents);
  });

  it("scales dirt and enforces minimum", () => {
    const heavy = calculateTreppenhausQuote(base({ dirtLevel: "heavy", stockwerke: 1, wohnungen: 1, stairTurnus: "monthly" }));
    // visit 70+7+3=80; monthly 80*1.3=104 → min 110
    assert.equal(heavy.monthlyNetCents, 11000);

    const mid = calculateTreppenhausQuote(base({ dirtLevel: "medium" }));
    assert.equal(mid.monthlyNetCents, Math.round(109 * 2 * 1.15 * 100));
  });

  it("flags large objects for inspection", () => {
    const q = calculateTreppenhausQuote(base({ stockwerke: 9, wohnungen: 18 }));
    assert.equal(q.needsInspection, true);
  });
});
