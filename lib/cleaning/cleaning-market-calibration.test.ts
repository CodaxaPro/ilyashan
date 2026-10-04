/**
 * Market-mid calibration proof — durations & €/visit vs DE 2026 bands.
 * Sources: RAL GGGR 2020 Leistungszahlen; Wischkahl/Andonov/Kleibrink visit tables.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateOfficeCleaningQuote,
  calculateWorkload,
  createInitialCustomerInput,
  DEFAULT_CLEANING_CONFIG,
  redistributeFloors,
  redistributeSubAreas,
  type CustomerInput,
} from "./index";

function typicalOffice(area: number, opts?: Partial<CustomerInput>): CustomerInput {
  const desks = Math.max(2, Math.round(area / 12));
  const toilets = area < 120 ? 1 : area < 350 ? 2 : 4;
  const kitchens = area < 400 ? 1 : 2;
  return createInitialCustomerInput({
    totalAreaM2: area,
    frequency: "2_PER_WEEK",
    usageIntensity: "NORMAL",
    condition: "NORMAL",
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
      workstations: desks,
      officeBins: desks,
      officeBinsAutoSuggested: true,
      meetingRooms: area >= 150 ? 1 : 0,
      meetingChairs: area >= 150 ? 8 : 0,
      cabinetExterior: false,
      shelving: false,
      windowSills: false,
      phoneMonitorExterior: false,
      whiteboards: false,
    },
    sanitary: {
      toilets,
      urinals: toilets >= 2 ? 1 : 0,
      washbasins: toilets,
      mirrors: toilets,
      sanitaryBins: toilets,
      showers: 0,
      cubicles: 0,
    },
    kitchen: {
      kitchens,
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
      stairFloors: area >= 300 ? 1 : 0,
      elevator: area >= 500,
      glassEntranceDoors: area >= 500 ? 2 : 0,
      receptionDetail: false,
      highTouchAreas: false,
    },
    ...opts,
  });
}

/** Wischkahl 2026 mid bands (netto €/visit) + duration mid */
const MARKET_BANDS: Record<
  number,
  { hoursMin: number; hoursMax: number; euroMin: number; euroMax: number }
> = {
  80: { hoursMin: 1.2, hoursMax: 2.2, euroMin: 50, euroMax: 95 },
  100: { hoursMin: 1.4, hoursMax: 2.4, euroMin: 55, euroMax: 100 },
  150: { hoursMin: 2.0, hoursMax: 3.2, euroMin: 80, euroMax: 140 },
  200: { hoursMin: 2.4, hoursMax: 3.8, euroMin: 95, euroMax: 155 },
  300: { hoursMin: 3.2, hoursMax: 5.2, euroMin: 125, euroMax: 210 },
  500: { hoursMin: 4.8, hoursMax: 7.5, euroMin: 175, euroMax: 295 },
};

describe("cleaning/market-mid calibration 80–500 m²", () => {
  for (const area of [80, 100, 150, 200, 300, 500] as const) {
    it(`${area} m²: person-hours + net € inside DE market mid band`, () => {
      const input = typicalOffice(area);
      const calc = calculateOfficeCleaningQuote(input);
      const hours = calc.admin.cost.requiredPersonHours;
      const billable = calc.admin.cost.billablePersonHours;
      const net = calc.customer.netCents / 100;
      const band = MARKET_BANDS[area];

      assert.ok(
        hours >= band.hoursMin && hours <= band.hoursMax,
        `${area}m² hours ${hours.toFixed(2)} outside [${band.hoursMin},${band.hoursMax}]`
      );
      assert.ok(
        net >= band.euroMin && net <= band.euroMax,
        `${area}m² net €${net.toFixed(0)} outside [${band.euroMin},${band.euroMax}]`
      );
      assert.ok(billable >= hours);
      // Larger objects must not flatten under small-object minimum
      if (area >= 200) {
        assert.ok(net > DEFAULT_CLEANING_CONFIG.minimumJobNetCents / 100 + 10);
      }
    });
  }

  it("price curve rises with area (not flat from min-job floor)", () => {
    const nets = [100, 200, 300, 500].map(
      (a) => calculateOfficeCleaningQuote(typicalOffice(a)).customer.netCents
    );
    assert.ok(nets[1]! > nets[0]! * 1.15, "200m² should be clearly above 100m²");
    assert.ok(nets[2]! > nets[1]! * 1.15, "300m² should be clearly above 200m²");
    assert.ok(nets[3]! > nets[2]! * 1.2, "500m² should be clearly above 300m²");
  });
});

describe("cleaning/form options affect workload", () => {
  it("every optional toggle adds minutes when enabled", () => {
    const base = typicalOffice(200);
    const baseMin = calculateWorkload(base, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;

    const toggles: Array<[string, (i: CustomerInput) => CustomerInput]> = [
      ["cabinetExterior", (i) => ({ ...i, office: { ...i.office, cabinetExterior: true } })],
      ["shelving", (i) => ({ ...i, office: { ...i.office, shelving: true } })],
      ["windowSills", (i) => ({ ...i, office: { ...i.office, windowSills: true } })],
      [
        "phoneMonitorExterior",
        (i) => ({ ...i, office: { ...i.office, phoneMonitorExterior: true } }),
      ],
      ["whiteboards", (i) => ({ ...i, office: { ...i.office, whiteboards: true } })],
      ["showers", (i) => ({ ...i, sanitary: { ...i.sanitary, showers: 1 } })],
      ["cubicles", (i) => ({ ...i, sanitary: { ...i.sanitary, cubicles: 2 } })],
      [
        "microwaveInside",
        (i) => ({ ...i, kitchen: { ...i.kitchen, microwaveInside: true } }),
      ],
      [
        "refrigeratorInside",
        (i) => ({ ...i, kitchen: { ...i.kitchen, refrigeratorInside: true } }),
      ],
      ["dishwasher", (i) => ({ ...i, kitchen: { ...i.kitchen, dishwasher: true } })],
      ["cabinetFronts", (i) => ({ ...i, kitchen: { ...i.kitchen, cabinetFronts: true } })],
      ["dishes", (i) => ({ ...i, kitchen: { ...i.kitchen, dishes: true } })],
      ["elevator", (i) => ({ ...i, additional: { ...i.additional, elevator: true } })],
      [
        "glassEntranceDoors",
        (i) => ({ ...i, additional: { ...i.additional, glassEntranceDoors: 2 } }),
      ],
      [
        "receptionDetail",
        (i) => ({ ...i, additional: { ...i.additional, receptionDetail: true } }),
      ],
      [
        "highTouchAreas",
        (i) => ({ ...i, additional: { ...i.additional, highTouchAreas: true } }),
      ],
      ["stairFloors", (i) => ({ ...i, additional: { ...i.additional, stairFloors: 2 } })],
    ];

    for (const [name, apply] of toggles) {
      const next = apply(base);
      const mins = calculateWorkload(next, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
      assert.ok(mins > baseMin + 0.5, `${name} must increase workload (${mins} vs ${baseMin})`);
    }
  });

  it("setup_travel is always present once", () => {
    const wl = calculateWorkload(typicalOffice(100), DEFAULT_CLEANING_CONFIG);
    const setup = wl.lines.filter((l) => l.taskId === "setup_travel" && l.minutes > 0);
    assert.equal(setup.length, 1);
    assert.ok(setup[0]!.minutes >= 15);
  });

  it("subAreas drive room_* minutes", () => {
    const wl = calculateWorkload(typicalOffice(200), DEFAULT_CLEANING_CONFIG);
    for (const id of [
      "room_office",
      "room_meeting",
      "room_kitchen",
      "room_sanitary",
      "room_corridors",
      "room_reception",
    ]) {
      assert.ok(
        wl.lines.some((l) => l.taskId === id && l.minutes > 0),
        `${id} must contribute`
      );
    }
  });

  it("more carpet than hard increases time (textile surcharge)", () => {
    const hard = typicalOffice(200, {
      floors: redistributeFloors(200, {
        carpet: 0,
        hard: 170,
        wet: 20,
        other: 10,
      }),
    });
    const carpet = typicalOffice(200, {
      floors: redistributeFloors(200, {
        carpet: 170,
        hard: 0,
        wet: 20,
        other: 10,
      }),
    });
    const h = calculateWorkload(hard, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
    const c = calculateWorkload(carpet, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
    assert.ok(c > h, `carpet ${c} should exceed hard ${h}`);
  });

  it("more office m² (less corridor) increases time", () => {
    const base = typicalOffice(200);
    const officeHeavy = {
      ...base,
      subAreas: {
        office: 160,
        meeting: 10,
        kitchen: 10,
        sanitary: 10,
        corridors: 5,
        reception: 3,
        other: 2,
      },
    };
    const corridorHeavy = {
      ...base,
      subAreas: {
        office: 80,
        meeting: 10,
        kitchen: 10,
        sanitary: 10,
        corridors: 70,
        reception: 15,
        other: 5,
      },
    };
    const a = calculateWorkload(officeHeavy, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
    const b = calculateWorkload(corridorHeavy, DEFAULT_CLEANING_CONFIG).requiredPersonMinutes;
    assert.ok(a > b, `office-heavy ${a} should exceed corridor-heavy ${b}`);
  });
});

describe("cleaning/RAL sanity", () => {
  it("effective object m²/h for 200 m² typical stays in serious (not dumping) band", () => {
    const wl = calculateWorkload(typicalOffice(200), DEFAULT_CLEANING_CONFIG);
    const effective = 200 / wl.requiredPersonHours;
    // Wischkahl FAQ ~40–60; RAL office-only 160–230 — mixed object with Rüst ≈ 50–90
    assert.ok(
      effective >= 45 && effective <= 100,
      `effective ${effective.toFixed(1)} m²/h looks unrealistic`
    );
  });
});
