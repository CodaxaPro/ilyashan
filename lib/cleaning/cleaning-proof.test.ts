/**
 * Büroreinigung P0 corporate proof suite — domain engines only.
 * Must not import or mutate Fensterreinigung pricing.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FIXTURE_A_SMALL,
  FIXTURE_B_NORMAL,
  FIXTURE_C_500,
  FIXTURE_D_1000,
  FIXTURE_E_INTENSIVE,
  FIXTURE_F_INCONSISTENT,
  FIXTURE_G_DENSITY,
  FIXTURE_H_MINIMUM,
  FIXTURE_I_MANUAL,
  FIXTURE_J_LANG,
  areasSynchronized,
  calculateOfficeCleaningQuote,
  centsToEuros,
  DEFAULT_CLEANING_CONFIG,
  findDoubleCountedTaskIds,
  floorsSynchronized,
  hasBlockingErrors,
  redistributeFloors,
  redistributeSubAreas,
  sellingNetFromCost,
  setFloorArea,
  setSubArea,
  toPublicQuotePayload,
  validateCustomerInput,
  eurosToCents,
  applyRounding,
  calculateWorkload,
} from "./index";

describe("cleaning/money", () => {
  it("stores integer cents", () => {
    assert.equal(eurosToCents(81.415), 8142);
    assert.equal(centsToEuros(8141), 81.41);
  });
});

describe("cleaning/area + floor invariants", () => {
  it("Σ subareas == total after redistribute", () => {
    const total = 500;
    const sub = redistributeSubAreas(total, {
      office: 200,
      meeting: 50,
      kitchen: 40,
      sanitary: 40,
      corridors: 80,
      reception: 40,
      other: 50,
    });
    assert.ok(areasSynchronized(total, sub));
  });

  it("Σ floors == total after redistribute", () => {
    const total = 500;
    const floors = redistributeFloors(total, {
      carpet: 100,
      hard: 200,
      wet: 50,
      other: 50,
    });
    assert.ok(floorsSynchronized(total, floors));
  });

  it("manual subarea edit keeps invariant", () => {
    const total = 500;
    let sub = redistributeSubAreas(total, {
      office: 250,
      meeting: 50,
      kitchen: 50,
      sanitary: 50,
      corridors: 50,
      reception: 25,
      other: 25,
    });
    sub = setSubArea(total, sub, "office", 300);
    assert.ok(areasSynchronized(total, sub));
    assert.equal(sub.office, 300);
  });

  it("manual floor edit keeps invariant", () => {
    const total = 200;
    let floors = redistributeFloors(total, {
      carpet: 80,
      hard: 80,
      wet: 20,
      other: 20,
    });
    floors = setFloorArea(total, floors, "carpet", 120);
    assert.ok(floorsSynchronized(total, floors));
    assert.equal(floors.carpet, 120);
  });

  it("totalArea change proportionally redistributes", () => {
    const start = redistributeSubAreas(100, {
      office: 70,
      meeting: 10,
      kitchen: 5,
      sanitary: 5,
      corridors: 5,
      reception: 3,
      other: 2,
    });
    const next = redistributeSubAreas(200, start);
    assert.ok(areasSynchronized(200, next));
    assert.ok(Math.abs(next.office - 140) < 1);
  });
});

describe("cleaning/validation", () => {
  it("F inconsistent areas → BLOCKING", () => {
    const issues = validateCustomerInput(FIXTURE_F_INCONSISTENT);
    assert.ok(hasBlockingErrors(issues));
    assert.ok(issues.some((i) => i.code === "SUBAREA_MISMATCH"));
  });

  it("G density → WARNING", () => {
    const issues = validateCustomerInput(FIXTURE_G_DENSITY);
    assert.ok(issues.some((i) => i.code === "DESK_DENSITY_HIGH"));
    assert.equal(hasBlockingErrors(issues), false);
  });
});

describe("cleaning/margin + VAT + rounding", () => {
  it("25% margin is cost/(1-0.25) not ×1.25", () => {
    const cost = 10_000;
    const sell = sellingNetFromCost(cost, 0.25);
    assert.equal(sell, 13_333);
    assert.notEqual(sell, 12_500);
  });

  it("gross = net + VAT 19%", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_B_NORMAL);
    const { netCents, vatCents, grossCents } = calc.customer;
    assert.equal(grossCents, netCents + vatCents);
    assert.equal(vatCents, Math.round((netCents * 1900) / 10_000));
  });

  it("rounding 0.50 keeps raw separately", () => {
    const raw = eurosToCents(81.41);
    const rounded = applyRounding(raw, "0.50");
    assert.ok(rounded >= raw);
    assert.equal(rounded % 50, 0);
  });
});

describe("cleaning/minimum vs workload", () => {
  it("H: billable hours ≥ minimum while required may be lower", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_H_MINIMUM);
    assert.ok(
      calc.admin.cost.billablePersonHours >=
        DEFAULT_CLEANING_CONFIG.minimumBillablePersonHours
    );
    assert.ok(
      calc.admin.cost.requiredPersonHours <= calc.admin.cost.billablePersonHours
    );
    assert.ok(calc.customer.netCents >= DEFAULT_CLEANING_CONFIG.minimumJobNetCents);
  });

  it("customer Dauer follows team onsite from billable hours, not raw workload alone", () => {
    const small = calculateOfficeCleaningQuote(FIXTURE_A_SMALL);
    const mid = calculateOfficeCleaningQuote(FIXTURE_B_NORMAL);
    assert.ok(
      small.admin.cost.billablePersonHours >=
        DEFAULT_CLEANING_CONFIG.minimumBillablePersonHours
    );
    assert.ok(small.customer.estimatedOnsiteHours >= 1);
    assert.ok(mid.customer.estimatedOnsiteHours >= 1.5);
    assert.ok(
      mid.admin.cost.billablePersonHours >= mid.admin.cost.requiredPersonHours
    );
  });
});

describe("cleaning/no double counting", () => {
  it("kitchen_bin not double-minuted when included in kitchen_base", () => {
    const wl = calculateWorkload(FIXTURE_B_NORMAL, DEFAULT_CLEANING_CONFIG);
    const binLines = wl.lines.filter((l) => l.taskId === "kitchen_bin_empty");
    const positive = binLines.filter((l) => l.minutes > 0);
    assert.equal(positive.length, 0);
    assert.ok(binLines.some((l) => l.excludedBy === "kitchen_base"));
    assert.deepEqual(findDoubleCountedTaskIds(wl.lines), []);
  });

  it("wet floor task id appears at most once with minutes", () => {
    const wl = calculateWorkload(FIXTURE_C_500, DEFAULT_CLEANING_CONFIG);
    assert.deepEqual(findDoubleCountedTaskIds(wl.lines), []);
  });
});

describe("cleaning/scenarios A–J", () => {
  const runnable = [
    ["A", FIXTURE_A_SMALL],
    ["B", FIXTURE_B_NORMAL],
    ["C", FIXTURE_C_500],
    ["D", FIXTURE_D_1000],
    ["E", FIXTURE_E_INTENSIVE],
    ["H", FIXTURE_H_MINIMUM],
  ] as const;

  for (const [name, fixture] of runnable) {
    it(`${name}: produces finite commercial quote`, () => {
      const calc = calculateOfficeCleaningQuote(fixture);
      assert.ok(Number.isFinite(calc.customer.netCents));
      assert.ok(calc.customer.netCents > 0);
      assert.ok(calc.admin.workload.requiredPersonHours >= 0);
      assert.ok(calc.customer.recommendedWorkers >= 1);
    });
  }

  it("F: blocking → MANUAL_REVIEW_REQUIRED", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_F_INCONSISTENT);
    assert.equal(calc.customer.quoteStatus, "MANUAL_REVIEW_REQUIRED");
    assert.ok(hasBlockingErrors(calc.admin.validation));
  });

  it("G: warning density still calculates", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_G_DENSITY);
    assert.ok(calc.admin.validation.some((i) => i.level === "WARNING"));
    assert.ok(calc.customer.netCents > 0);
  });

  it("I: large facility → MANUAL_REVIEW_REQUIRED", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_I_MANUAL);
    assert.equal(calc.customer.quoteStatus, "MANUAL_REVIEW_REQUIRED");
  });

  it("J: DE/TR language does not change numerical result", () => {
    const de = calculateOfficeCleaningQuote({ ...FIXTURE_C_500, language: "de" });
    const tr = calculateOfficeCleaningQuote({ ...FIXTURE_J_LANG, language: "tr" });
    assert.equal(de.customer.netCents, tr.customer.netCents);
    assert.equal(de.customer.grossCents, tr.customer.grossCents);
    assert.equal(de.admin.workload.requiredPersonMinutes, tr.admin.workload.requiredPersonMinutes);
  });
});

describe("cleaning/customer-admin separation", () => {
  it("public payload has no cost/margin fields", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_C_500);
    const pub = toPublicQuotePayload(calc);
    const json = JSON.stringify(pub);
    assert.equal(json.includes("laborCost"), false);
    assert.equal(json.includes("targetMargin"), false);
    assert.equal(json.includes("overhead"), false);
    assert.equal(json.includes("productiveHour"), false);
    assert.ok("netCents" in pub);
    assert.ok("recommendedWorkers" in pub);
  });

  it("admin retains explainability chain", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_C_500);
    assert.ok(calc.admin.workload.lines.length > 0);
    assert.ok(calc.admin.cost.totalCostCents > 0);
    assert.ok(calc.admin.price.realizedMargin > 0);
    assert.equal(calc.admin.configVersionId, DEFAULT_CLEANING_CONFIG.configVersionId);
  });
});

describe("cleaning/seed provenance", () => {
  it("active seed tasks remain CALIBRATION_REQUIRED with documented source", () => {
    const allowedSource = new Set([
      "ADMIN_ESTIMATE",
      "PUBLIC_BENCHMARK",
      "INTERNAL_TIME_STUDY",
      "LICENSED_STANDARD",
      "LEGAL_REQUIREMENT",
    ]);
    const allowedStatus = new Set(["CALIBRATION_REQUIRED", "DEPRECATED", "APPROVED"]);
    for (const task of DEFAULT_CLEANING_CONFIG.tasks) {
      assert.ok(allowedStatus.has(task.status), task.id);
      assert.ok(allowedSource.has(task.sourceType), task.id);
      assert.ok(task.sourceReference.length > 0, task.id);
      if (task.active) {
        assert.equal(task.status, "CALIBRATION_REQUIRED", task.id);
      }
    }
  });

  it("LG1 floor seed is 15.00 for 2026", () => {
    assert.equal(DEFAULT_CLEANING_CONFIG.lg1GrossHourlyEuros, 15);
  });
});

describe("cleaning/isolation from Fenster", () => {
  it("does not require windowCount", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_A_SMALL);
    assert.equal("windowCount" in (FIXTURE_A_SMALL as object), false);
    assert.ok(calc.customer.netCents > 0);
  });
});
