/**
 * Cross-proof: form fields ↔ tasks, factor matrix, team, commercial discounts.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FORM_FIELD_COVERAGE,
  calculateOfficeCleaningQuote,
  calculateWorkload,
  createInitialCustomerInput,
  DEFAULT_CLEANING_CONFIG,
  recommendTeam,
  redistributeFloors,
  redistributeSubAreas,
  type CleaningCondition,
  type CleaningFrequency,
  type CustomerInput,
  type UsageIntensity,
} from "./index";

function baseInput(): CustomerInput {
  const area = 200;
  return createInitialCustomerInput({
    totalAreaM2: area,
    frequency: "2_PER_WEEK",
    usageIntensity: "NORMAL",
    condition: "NORMAL",
    language: "de",
    subAreas: redistributeSubAreas(area, {
      office: 110,
      meeting: 24,
      kitchen: 16,
      sanitary: 16,
      corridors: 20,
      reception: 10,
      other: 4,
    }),
    floors: redistributeFloors(area, {
      carpet: 80,
      hard: 90,
      wet: 20,
      other: 10,
    }),
    office: {
      workstations: 10,
      officeBins: 10,
      officeBinsAutoSuggested: true,
      meetingRooms: 1,
      meetingChairs: 8,
      cabinetExterior: false,
      shelving: false,
      windowSills: false,
      phoneMonitorExterior: false,
      whiteboards: false,
    },
    sanitary: {
      toilets: 2,
      urinals: 1,
      washbasins: 2,
      mirrors: 2,
      sanitaryBins: 2,
      showers: 0,
      cubicles: 0,
    },
    kitchen: {
      kitchens: 1,
      tables: 1,
      chairs: 4,
      sinks: 1,
      countertopUnits: 2,
      bins: 1,
      applianceExteriors: 2,
      microwaveInside: false,
      refrigeratorInside: false,
      dishwasher: false,
      cabinetFronts: false,
      dishes: false,
    },
    additional: {
      stairFloors: 0,
      elevator: false,
      glassEntranceDoors: 0,
      receptionDetail: false,
      highTouchAreas: false,
    },
  });
}

describe("cleaning/form-coverage registry", () => {
  it("every coverage task id exists in seed (or is factor wildcard)", () => {
    const ids = new Set(DEFAULT_CLEANING_CONFIG.tasks.map((t) => t.id));
    for (const row of FORM_FIELD_COVERAGE) {
      for (const taskId of row.taskIds) {
        if (taskId === "*") continue;
        assert.ok(ids.has(taskId), `missing seed task ${taskId} for ${row.path}`);
      }
    }
  });

  it("customer UI marks all priced fields as inCustomerUi", () => {
    for (const row of FORM_FIELD_COVERAGE) {
      assert.equal(row.inCustomerUi, true, row.path);
    }
  });

  it("CleaningCalculator references every UI-mapped i18n / field path", () => {
    const ui = readFileSync(
      join(process.cwd(), "components/cleaning/CleaningCalculator.tsx"),
      "utf8"
    );
    const mustAppear = [
      "phoneMonitorExterior",
      "whiteboards",
      "cubicles",
      "kitchenChairs",
      "counters",
      "appliances",
      "dishwasher",
      "cabinetFronts",
      "dishes",
      "receptionDetail",
      "highTouchAreas",
      "shelving",
      "windowSills",
      "subAreas",
      "usageIntensity",
      "condition",
      "frequency",
    ];
    for (const key of mustAppear) {
      assert.ok(ui.includes(key), `UI missing ${key}`);
    }
  });
});

describe("cleaning/factor matrix frequency×condition×usage", () => {
  const frequencies: CleaningFrequency[] = [
    "ONE_TIME",
    "1_PER_WEEK",
    "2_PER_WEEK",
    "3_PER_WEEK",
    "5_PER_WEEK",
  ];
  const conditions: CleaningCondition[] = [
    "MAINTAINED",
    "NORMAL",
    "NEGLECTED",
    "INITIAL_INTENSIVE",
  ];
  const usages: UsageIntensity[] = ["LOW", "NORMAL", "HIGH"];

  it("all combinations produce finite minutes scaled by config factors", () => {
    const baselineInput = baseInput();
    const baseline = calculateWorkload(baselineInput, DEFAULT_CLEANING_CONFIG);
    assert.ok(baseline.requiredPersonMinutes > 0);
    const baselineFactor =
      (DEFAULT_CLEANING_CONFIG.conditionFactors[baselineInput.condition] ?? 1) *
      (DEFAULT_CLEANING_CONFIG.usageFactors[baselineInput.usageIntensity] ?? 1) *
      (DEFAULT_CLEANING_CONFIG.frequencyWorkloadFactors[baselineInput.frequency] ?? 1);

    for (const frequency of frequencies) {
      for (const condition of conditions) {
        for (const usageIntensity of usages) {
          const input = { ...baseInput(), frequency, condition, usageIntensity };
          const wl = calculateWorkload(input, DEFAULT_CLEANING_CONFIG);
          const calc = calculateOfficeCleaningQuote(input);
          assert.ok(
            Number.isFinite(wl.requiredPersonMinutes) && wl.requiredPersonMinutes > 0,
            `${frequency}/${condition}/${usageIntensity}`
          );
          assert.ok(calc.customer.netCents > 0);

          const expectedFactor =
            (DEFAULT_CLEANING_CONFIG.conditionFactors[condition] ?? 1) *
            (DEFAULT_CLEANING_CONFIG.usageFactors[usageIntensity] ?? 1) *
            (DEFAULT_CLEANING_CONFIG.frequencyWorkloadFactors[frequency] ?? 1);
          const expectedMinutes =
            baseline.requiredPersonMinutes * (expectedFactor / baselineFactor);
          assert.ok(
            Math.abs(wl.requiredPersonMinutes - expectedMinutes) < 0.05,
            `factor mismatch ${frequency}/${condition}/${usageIntensity}: ${wl.requiredPersonMinutes} vs ${expectedMinutes}`
          );
        }
      }
    }
  });

  it("commercial frequency discount lowers net vs 1×/week same workload factors", () => {
    const one = calculateOfficeCleaningQuote({
      ...baseInput(),
      frequency: "1_PER_WEEK",
    });
    const five = calculateOfficeCleaningQuote({
      ...baseInput(),
      frequency: "5_PER_WEEK",
    });
    // 5× has lower workload factor AND commercial discount → clearly cheaper per visit
    assert.ok(five.customer.netCents < one.customer.netCents);
    assert.ok(five.admin.price.commercialDiscountRate > 0);
  });
});

describe("cleaning/team recommendation", () => {
  it("larger jobs recommend more workers and shorter onsite", () => {
    const small = calculateOfficeCleaningQuote(baseInput());
    const large = calculateOfficeCleaningQuote({
      ...baseInput(),
      totalAreaM2: 500,
      subAreas: redistributeSubAreas(500, {
        office: 275,
        meeting: 60,
        kitchen: 40,
        sanitary: 40,
        corridors: 50,
        reception: 25,
        other: 10,
      }),
      floors: redistributeFloors(500, {
        carpet: 200,
        hard: 225,
        wet: 50,
        other: 25,
      }),
      office: {
        ...baseInput().office,
        workstations: 40,
        officeBins: 40,
      },
    });
    assert.ok(large.admin.cost.billablePersonHours > small.admin.cost.billablePersonHours);
    assert.ok(large.customer.recommendedWorkers >= small.customer.recommendedWorkers);
  });

  it("recommendTeam stays within 1..maxTeamSize", () => {
    for (const hours of [0.5, 2, 4, 8, 12, 20]) {
      const team = recommendTeam(hours, DEFAULT_CLEANING_CONFIG);
      assert.ok(team.workers >= 1 && team.workers <= DEFAULT_CLEANING_CONFIG.maxTeamSize);
      assert.ok(team.onsiteHoursRounded > 0);
    }
  });
});

describe("cleaning/count fields change minutes", () => {
  it("desks / toilets / kitchens each move the needle", () => {
    const base = calculateWorkload(baseInput(), DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
    const moreDesks = calculateWorkload(
      {
        ...baseInput(),
        office: { ...baseInput().office, workstations: 25, officeBins: 25 },
      },
      DEFAULT_CLEANING_CONFIG
    ).requiredPersonMinutes;
    const moreToilets = calculateWorkload(
      {
        ...baseInput(),
        sanitary: { ...baseInput().sanitary, toilets: 6, washbasins: 6, mirrors: 6 },
      },
      DEFAULT_CLEANING_CONFIG
    ).requiredPersonMinutes;
    const moreKitchens = calculateWorkload(
      {
        ...baseInput(),
        kitchen: { ...baseInput().kitchen, kitchens: 3 },
      },
      DEFAULT_CLEANING_CONFIG
    ).requiredPersonMinutes;
    assert.ok(moreDesks > base);
    assert.ok(moreToilets > base);
    assert.ok(moreKitchens > base);
  });
});
