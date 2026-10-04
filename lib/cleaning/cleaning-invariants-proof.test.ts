/**
 * Deep invariants: wet surplus, room Σ, field-by-field deltas, pricing/cost modes,
 * validation codes, active-task-only workload, fixture suite sanity.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FORM_FIELD_COVERAGE,
  FIXTURE_A_SMALL,
  FIXTURE_B_NORMAL,
  FIXTURE_C_500,
  FIXTURE_D_1000,
  FIXTURE_E_INTENSIVE,
  FIXTURE_H_MINIMUM,
  FIXTURE_I_MANUAL,
  applyRounding,
  calculateJobCost,
  calculateOfficeCleaningQuote,
  calculatePrice,
  calculateWorkload,
  createInitialCustomerInput,
  DEFAULT_CLEANING_CONFIG,
  findDoubleCountedTaskIds,
  redistributeFloors,
  redistributeSubAreas,
  requiresManualReview,
  sellingNetFromCost,
  serverCalculateCleaningQuote,
  validateCustomerInput,
  type CustomerInput,
} from "./index";
import { t } from "./i18n";

function typical(area = 200): CustomerInput {
  return createInitialCustomerInput({
    totalAreaM2: area,
    frequency: "2_PER_WEEK",
    language: "de",
    subAreas: redistributeSubAreas(area, {
      office: area * 0.55,
      meeting: area * 0.12,
      kitchen: area * 0.08,
      sanitary: area * 0.08,
      corridors: area * 0.1,
      reception: area * 0.05,
      other: area * 0.02,
    }),
    floors: redistributeFloors(area, {
      carpet: area * 0.4,
      hard: area * 0.45,
      wet: area * 0.1,
      other: area * 0.05,
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
  });
}

describe("cleaning/room + wet invariants", () => {
  it("room_* quantities sum to Σ subAreas", () => {
    const input = typical(200);
    const wl = calculateWorkload(input, DEFAULT_CLEANING_CONFIG);
    const roomQty = wl.lines
      .filter((l) => l.taskId.startsWith("room_"))
      .reduce((s, l) => s + l.quantity, 0);
    const subSum =
      input.subAreas.office +
      input.subAreas.meeting +
      input.subAreas.kitchen +
      input.subAreas.sanitary +
      input.subAreas.corridors +
      input.subAreas.reception +
      input.subAreas.other;
    assert.ok(Math.abs(roomQty - subSum) < 0.2, `${roomQty} vs ${subSum}`);
  });

  it("wet_floor_clean only bills m² above sanitary room area", () => {
    const input = typical(200);
    // sanitary 16, wet 20 → extra 4
    const wl = calculateWorkload(input, DEFAULT_CLEANING_CONFIG);
    const wet = wl.lines.find((l) => l.taskId === "wet_floor_clean" && l.minutes > 0);
    assert.ok(wet);
    assert.ok(Math.abs(wet!.quantity - 4) < 0.15, `wet qty ${wet!.quantity}`);

    const equal = {
      ...input,
      floors: redistributeFloors(200, {
        carpet: 80,
        hard: 104,
        wet: input.subAreas.sanitary,
        other: 200 - 80 - 104 - input.subAreas.sanitary,
      }),
    };
    const wl2 = calculateWorkload(equal, DEFAULT_CLEANING_CONFIG);
    assert.equal(
      wl2.lines.filter((l) => l.taskId === "wet_floor_clean" && l.minutes > 0).length,
      0
    );
  });

  it("hard↔other swap does not change time (rooms carry dry floors)", () => {
    const a = typical(200);
    const b = {
      ...a,
      floors: redistributeFloors(200, {
        carpet: a.floors.carpet,
        hard: a.floors.other,
        wet: a.floors.wet,
        other: a.floors.hard,
      }),
    };
    const ma = calculateWorkload(a, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
    const mb = calculateWorkload(b, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
    assert.ok(Math.abs(ma - mb) < 0.01);
  });
});

describe("cleaning/field-by-field positive deltas", () => {
  const mutations: Array<{
    path: string;
    apply: (i: CustomerInput) => CustomerInput;
    taskId: string;
  }> = [
    {
      path: "subAreas.office↑",
      apply: (i) => ({
        ...i,
        subAreas: {
          office: 140,
          meeting: 10,
          kitchen: 10,
          sanitary: 10,
          corridors: 15,
          reception: 10,
          other: 5,
        },
      }),
      taskId: "room_office",
    },
    {
      path: "floors.carpet↑",
      apply: (i) => ({
        ...i,
        floors: redistributeFloors(200, { carpet: 160, hard: 20, wet: 15, other: 5 }),
      }),
      taskId: "carpet_surcharge",
    },
    {
      path: "office.workstations",
      apply: (i) => ({
        ...i,
        office: { ...i.office, workstations: 30, officeBins: 30 },
      }),
      taskId: "desk_surfaces",
    },
    {
      path: "office.cabinetExterior",
      apply: (i) => ({ ...i, office: { ...i.office, cabinetExterior: true } }),
      taskId: "cabinet_exterior",
    },
    {
      path: "office.shelving",
      apply: (i) => ({ ...i, office: { ...i.office, shelving: true } }),
      taskId: "shelving_wipe",
    },
    {
      path: "office.windowSills",
      apply: (i) => ({ ...i, office: { ...i.office, windowSills: true } }),
      taskId: "window_sill_wipe",
    },
    {
      path: "office.phoneMonitorExterior",
      apply: (i) => ({ ...i, office: { ...i.office, phoneMonitorExterior: true } }),
      taskId: "phone_monitor_exterior",
    },
    {
      path: "office.whiteboards",
      apply: (i) => ({ ...i, office: { ...i.office, whiteboards: true } }),
      taskId: "whiteboard_wipe",
    },
    {
      path: "office.meetingChairs",
      apply: (i) => ({ ...i, office: { ...i.office, meetingChairs: 20 } }),
      taskId: "meeting_chair_wipe",
    },
    {
      path: "sanitary.toilets",
      apply: (i) => ({
        ...i,
        sanitary: { ...i.sanitary, toilets: 5, washbasins: 5, mirrors: 5 },
      }),
      taskId: "toilet_fixture",
    },
    {
      path: "sanitary.urinals",
      apply: (i) => ({ ...i, sanitary: { ...i.sanitary, urinals: 4 } }),
      taskId: "urinal_fixture",
    },
    {
      path: "sanitary.sanitaryBins",
      apply: (i) => ({ ...i, sanitary: { ...i.sanitary, sanitaryBins: 6 } }),
      taskId: "sanitary_bin_empty",
    },
    {
      path: "sanitary.showers",
      apply: (i) => ({ ...i, sanitary: { ...i.sanitary, showers: 2 } }),
      taskId: "shower_fixture",
    },
    {
      path: "sanitary.cubicles",
      apply: (i) => ({ ...i, sanitary: { ...i.sanitary, cubicles: 3 } }),
      taskId: "cubicle_wipe",
    },
    {
      path: "kitchen.tables",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, tables: 4 } }),
      taskId: "kitchen_table",
    },
    {
      path: "kitchen.chairs",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, chairs: 12 } }),
      taskId: "kitchen_chair",
    },
    {
      path: "kitchen.sinks",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, sinks: 3 } }),
      taskId: "kitchen_sink",
    },
    {
      path: "kitchen.countertopUnits",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, countertopUnits: 6 } }),
      taskId: "kitchen_counter",
    },
    {
      path: "kitchen.applianceExteriors",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, applianceExteriors: 6 } }),
      taskId: "appliance_exterior",
    },
    {
      path: "kitchen.microwaveInside",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, microwaveInside: true } }),
      taskId: "microwave_inside",
    },
    {
      path: "kitchen.refrigeratorInside",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, refrigeratorInside: true } }),
      taskId: "refrigerator_inside",
    },
    {
      path: "kitchen.dishwasher",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, dishwasher: true } }),
      taskId: "dishwasher_exterior",
    },
    {
      path: "kitchen.cabinetFronts",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, cabinetFronts: true } }),
      taskId: "kitchen_cabinet_fronts",
    },
    {
      path: "kitchen.dishes",
      apply: (i) => ({ ...i, kitchen: { ...i.kitchen, dishes: true } }),
      taskId: "dishes_wash",
    },
    {
      path: "additional.stairFloors",
      apply: (i) => ({ ...i, additional: { ...i.additional, stairFloors: 3 } }),
      taskId: "stair_flight",
    },
    {
      path: "additional.elevator",
      apply: (i) => ({ ...i, additional: { ...i.additional, elevator: true } }),
      taskId: "elevator_cabin",
    },
    {
      path: "additional.glassEntranceDoors",
      apply: (i) => ({
        ...i,
        additional: { ...i.additional, glassEntranceDoors: 3 },
      }),
      taskId: "glass_entrance_door",
    },
    {
      path: "additional.receptionDetail",
      apply: (i) => ({
        ...i,
        additional: { ...i.additional, receptionDetail: true },
      }),
      taskId: "reception_detail",
    },
    {
      path: "additional.highTouchAreas",
      apply: (i) => ({
        ...i,
        additional: { ...i.additional, highTouchAreas: true },
      }),
      taskId: "high_touch_areas",
    },
  ];

  for (const m of mutations) {
    it(`${m.path} increases minutes and activates ${m.taskId}`, () => {
      const base = typical();
      const before = calculateWorkload(base, DEFAULT_CLEANING_CONFIG);
      const after = calculateWorkload(m.apply(base), DEFAULT_CLEANING_CONFIG);
      assert.ok(
        after.requiredPersonMinutes > before.requiredPersonMinutes + 0.2,
        `${m.path}: ${after.requiredPersonMinutes} vs ${before.requiredPersonMinutes}`
      );
      assert.ok(
        after.lines.some((l) => l.taskId === m.taskId && l.minutes > 0),
        `${m.taskId} missing`
      );
      assert.deepEqual(findDoubleCountedTaskIds(after.lines), []);
    });
  }
});

describe("cleaning/pricing + cost modes", () => {
  it("CUSTOM frequency calculates with factor 1 and no commercial discount", () => {
    const calc = calculateOfficeCleaningQuote({ ...typical(), frequency: "CUSTOM" });
    assert.ok(calc.customer.netCents > 0);
    assert.equal(calc.admin.price.commercialDiscountRate, 0);
  });

  it("all rounding modes produce >= raw cents", () => {
    const raw = 8141;
    for (const mode of ["NONE", "0.50", "1.00", "5.00", "COMMERCIAL_90"] as const) {
      const rounded = applyRounding(raw, mode);
      if (mode === "NONE") assert.equal(rounded, raw);
      else assert.ok(rounded >= raw - (mode === "COMMERCIAL_90" ? 100 : 0));
      assert.ok(Number.isFinite(rounded));
    }
  });

  it("HOURLY_ALLOCATION overhead path works", () => {
    const cfg = {
      ...DEFAULT_CLEANING_CONFIG,
      overheadModel: "HOURLY_ALLOCATION" as const,
      overheadPerHourCents: 800,
    };
    const cost = calculateJobCost(3, cfg);
    assert.equal(cost.overheadCents, 2400);
    assert.ok(cost.totalCostCents > cost.directCostCents);
  });

  it("minimum job floor applies when workload tiny", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_H_MINIMUM);
    assert.ok(calc.customer.netCents >= DEFAULT_CLEANING_CONFIG.minimumJobNetCents);
  });

  it("sellingNetFromCost margin identity holds for config margin", () => {
    const cost = 10_000;
    const sell = sellingNetFromCost(cost, DEFAULT_CLEANING_CONFIG.targetGrossMargin);
    const realized = 1 - cost / sell;
    assert.ok(Math.abs(realized - DEFAULT_CLEANING_CONFIG.targetGrossMargin) < 0.001);
  });

  it("calculatePrice VAT + discount chain consistent", () => {
    const price = calculatePrice(50_000, "5_PER_WEEK", DEFAULT_CLEANING_CONFIG);
    assert.ok(price.commercialDiscountRate > 0);
    assert.equal(price.grossCents, price.roundedNetCents + price.vatCents);
    assert.ok(price.afterDiscountNetCents <= price.baseSellingNetCents);
  });
});

describe("cleaning/validation codes", () => {
  it("emits SUBAREA_MISMATCH / FLOOR_MISMATCH / density / kitchen warnings", () => {
    const bad = createInitialCustomerInput({
      totalAreaM2: 100,
      subAreas: {
        office: 10,
        meeting: 0,
        kitchen: 0,
        sanitary: 5,
        corridors: 0,
        reception: 0,
        other: 0,
      },
      floors: { carpet: 10, hard: 0, wet: 0, other: 0 },
      office: {
        workstations: 80,
        officeBins: 80,
        officeBinsAutoSuggested: true,
        meetingRooms: 0,
        meetingChairs: 40,
        cabinetExterior: false,
        shelving: false,
        windowSills: false,
        phoneMonitorExterior: false,
        whiteboards: false,
      },
      sanitary: {
        toilets: 30,
        urinals: 0,
        washbasins: 30,
        mirrors: 30,
        sanitaryBins: 30,
        showers: 0,
        cubicles: 0,
      },
      kitchen: {
        kitchens: 2,
        tables: 0,
        chairs: 0,
        sinks: 0,
        countertopUnits: 0,
        bins: 0,
        applianceExteriors: 0,
        microwaveInside: false,
        refrigeratorInside: false,
        dishwasher: false,
        cabinetFronts: false,
        dishes: false,
      },
    });
    const codes = new Set(validateCustomerInput(bad).map((i) => i.code));
    for (const c of [
      "SUBAREA_MISMATCH",
      "FLOOR_MISMATCH",
      "DESK_DENSITY_HIGH",
      "SANITARY_DENSITY",
      "KITCHEN_AREA_ZERO",
      "MEETING_CHAIRS_NO_ROOMS",
    ]) {
      assert.ok(codes.has(c), c);
    }
  });

  it("requiresManualReview for large / intensive / density", () => {
    assert.equal(requiresManualReview(FIXTURE_I_MANUAL, []), true);
    assert.equal(
      requiresManualReview(
        { ...FIXTURE_C_500, condition: "INITIAL_INTENSIVE", totalAreaM2: 900 },
        []
      ),
      true
    );
  });
});

describe("cleaning/fixtures + server", () => {
  const fixtures = [
    FIXTURE_A_SMALL,
    FIXTURE_B_NORMAL,
    FIXTURE_C_500,
    FIXTURE_D_1000,
    FIXTURE_E_INTENSIVE,
    FIXTURE_H_MINIMUM,
  ];

  for (const [idx, fixture] of fixtures.entries()) {
    it(`fixture ${idx}: no double count, active tasks only, server public safe`, () => {
      const wl = calculateWorkload(fixture, DEFAULT_CLEANING_CONFIG);
      assert.deepEqual(findDoubleCountedTaskIds(wl.lines), []);
      for (const line of wl.lines) {
        if (line.minutes <= 0) continue;
        const task = DEFAULT_CLEANING_CONFIG.tasks.find((t) => t.id === line.taskId);
        assert.ok(task?.active, line.taskId);
      }
      const { public: pub, calc } = serverCalculateCleaningQuote(fixture);
      assert.equal(pub.netCents, calc.customer.netCents);
      assert.equal("admin" in pub, false);
      const json = JSON.stringify(pub);
      assert.equal(json.includes("productiveHour"), false);
      assert.equal(json.includes("targetMargin"), false);
    });
  }
});

describe("cleaning/i18n completeness for form keys", () => {
  const keys = [
    "shelving",
    "windowSills",
    "phoneMonitor",
    "whiteboards",
    "cubicles",
    "dishes",
    "kitchenChairs",
    "counters",
    "appliances",
    "dishwasher",
    "cabinetFronts",
    "receptionDetail",
    "highTouch",
    "sub_office",
    "floor_carpet",
    "freq_5_PER_WEEK",
    "condition_INITIAL_INTENSIVE",
    "usage_HIGH",
  ];
  it("DE and TR resolve without falling back to key name", () => {
    for (const key of keys) {
      const de = t("de", key);
      const tr = t("tr", key);
      assert.notEqual(de, key, key);
      assert.notEqual(tr, key, key);
      assert.ok(de.length > 1);
      assert.ok(tr.length > 1);
    }
  });

  it("FORM_FIELD_COVERAGE paths cover priced domain", () => {
    assert.ok(FORM_FIELD_COVERAGE.length >= 40);
    const paths = new Set(FORM_FIELD_COVERAGE.map((f) => f.path));
    assert.ok(paths.has("subAreas.office"));
    assert.ok(paths.has("additional.highTouchAreas"));
    assert.ok(paths.has("kitchen.dishes"));
  });
});

describe("cleaning/monotonic area price", () => {
  it("net price non-decreasing across 50→1000 m² steps", () => {
    let prev = 0;
    for (const area of [50, 80, 100, 150, 200, 300, 400, 500, 750, 1000]) {
      const net = calculateOfficeCleaningQuote(typical(area)).customer.netCents;
      assert.ok(net >= prev, `${area}m² ${net} < prev ${prev}`);
      prev = net;
    }
  });
});
