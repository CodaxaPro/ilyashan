/**
 * Monthly indication proof — visits/week × (52/12) × net/visit.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateOfficeCleaningQuote,
  createInitialCustomerInput,
  DEFAULT_CLEANING_CONFIG,
  estimateMonthlyGrossCents,
  estimateMonthlyNetCents,
  FIXTURE_B_NORMAL,
  redistributeFloors,
  redistributeSubAreas,
  toPublicQuotePayload,
  visitsPerWeekForFrequency,
  WEEKS_PER_MONTH_AVG,
  type CleaningFrequency,
  type CustomerInput,
} from "./index";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function office(area: number, frequency: CleaningFrequency, extra?: Partial<CustomerInput>): CustomerInput {
  return createInitialCustomerInput({
    totalAreaM2: area,
    frequency,
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
      workstations: Math.max(2, Math.round(area / 12)),
      officeBins: Math.max(2, Math.round(area / 12)),
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
    ...extra,
  });
}

describe("cleaning/monthly helpers", () => {
  it("weeks-per-month average is exactly 52/12", () => {
    assert.equal(WEEKS_PER_MONTH_AVG, 52 / 12);
  });

  it("maps fixed frequencies to visits/week", () => {
    assert.equal(visitsPerWeekForFrequency("1_PER_WEEK"), 1);
    assert.equal(visitsPerWeekForFrequency("2_PER_WEEK"), 2);
    assert.equal(visitsPerWeekForFrequency("3_PER_WEEK"), 3);
    assert.equal(visitsPerWeekForFrequency("5_PER_WEEK"), 5);
    assert.equal(visitsPerWeekForFrequency("ONE_TIME"), null);
    assert.equal(visitsPerWeekForFrequency("CUSTOM"), null);
    assert.equal(visitsPerWeekForFrequency("CUSTOM", 4), 4);
    assert.equal(visitsPerWeekForFrequency("CUSTOM", 0), null);
  });

  it("monthly net = round(net × visits/week × 52/12)", () => {
    const net = 9700; // €97.00
    assert.equal(estimateMonthlyNetCents(net, "1_PER_WEEK"), Math.round(net * 1 * (52 / 12)));
    assert.equal(estimateMonthlyNetCents(net, "2_PER_WEEK"), Math.round(net * 2 * (52 / 12)));
    assert.equal(estimateMonthlyNetCents(net, "3_PER_WEEK"), Math.round(net * 3 * (52 / 12)));
    assert.equal(estimateMonthlyNetCents(net, "5_PER_WEEK"), Math.round(net * 5 * (52 / 12)));
    assert.equal(estimateMonthlyNetCents(net, "ONE_TIME"), null);
    assert.equal(estimateMonthlyNetCents(net, "CUSTOM"), null);
    assert.equal(estimateMonthlyNetCents(net, "CUSTOM", 2.5), Math.round(net * 2.5 * (52 / 12)));
  });

  it("monthly gross applies VAT bps on monthly net", () => {
    const monthlyNet = 42_033;
    const vatBps = DEFAULT_CLEANING_CONFIG.vatRateBps;
    const expected = Math.round(monthlyNet + (monthlyNet * vatBps) / 10_000);
    assert.equal(estimateMonthlyGrossCents(monthlyNet, vatBps), expected);
  });
});

describe("cleaning/monthly quote integration", () => {
  it("attaches monthly fields on recurring quotes", () => {
    const calc = calculateOfficeCleaningQuote(FIXTURE_B_NORMAL);
    const { netCents, monthlyNetCents, monthlyGrossCents, frequency } = calc.customer;
    assert.equal(frequency, "2_PER_WEEK");
    assert.ok(monthlyNetCents != null);
    assert.ok(monthlyGrossCents != null);
    assert.equal(monthlyNetCents, Math.round(netCents * 2 * (52 / 12)));
    assert.equal(
      monthlyGrossCents,
      estimateMonthlyGrossCents(monthlyNetCents!, DEFAULT_CLEANING_CONFIG.vatRateBps)
    );
  });

  it("public payload includes monthly fields without admin internals", () => {
    const pub = toPublicQuotePayload(calculateOfficeCleaningQuote(FIXTURE_B_NORMAL));
    assert.ok("monthlyNetCents" in pub);
    assert.ok("monthlyGrossCents" in pub);
    assert.ok(pub.monthlyNetCents != null && pub.monthlyNetCents > pub.netCents);
    const json = JSON.stringify(pub);
    assert.equal(json.includes("targetMargin"), false);
    assert.equal(json.includes("laborCost"), false);
  });

  it("ONE_TIME has null monthly", () => {
    const calc = calculateOfficeCleaningQuote(office(200, "ONE_TIME"));
    assert.equal(calc.customer.monthlyNetCents, null);
    assert.equal(calc.customer.monthlyGrossCents, null);
  });

  it("CUSTOM without per-week has null monthly; with value computes", () => {
    const bare = calculateOfficeCleaningQuote(office(200, "CUSTOM"));
    assert.equal(bare.customer.monthlyNetCents, null);

    const withCustom = calculateOfficeCleaningQuote(
      office(200, "CUSTOM", { customFrequencyPerWeek: 4 })
    );
    assert.equal(
      withCustom.customer.monthlyNetCents,
      Math.round(withCustom.customer.netCents * 4 * (52 / 12))
    );
  });

  it("5×/week monthly = visit × 5 × 52/12 for 200 m² band", () => {
    const calc = calculateOfficeCleaningQuote(office(200, "5_PER_WEEK"));
    const visit = calc.customer.netCents;
    const monthly = calc.customer.monthlyNetCents;
    assert.ok(monthly != null);
    assert.equal(monthly, Math.round(visit * 5 * (52 / 12)));
    // Sanity: ~€97/visit → ~€2.100/month (5 × 52/12)
    assert.ok(visit >= 8_000 && visit <= 13_000, `visit ${visit} out of mid band`);
    assert.ok(monthly >= 180_000 && monthly <= 280_000, `monthly ${monthly} out of mid band`);
  });

  it("higher frequency: lower visit net, higher monthly net (same object)", () => {
    const one = calculateOfficeCleaningQuote(office(200, "1_PER_WEEK")).customer;
    const five = calculateOfficeCleaningQuote(office(200, "5_PER_WEEK")).customer;
    assert.ok(five.netCents < one.netCents);
    assert.ok(five.monthlyNetCents! > one.monthlyNetCents!);
  });
});

describe("cleaning/monthly UI wiring", () => {
  it("summary + mobile dock render monthly test ids and i18n keys", () => {
    const summary = readFileSync(
      join(process.cwd(), "components/cleaning/CleaningSummaryContent.tsx"),
      "utf8"
    );
    const calcUi = readFileSync(
      join(process.cwd(), "components/cleaning/CleaningCalculator.tsx"),
      "utf8"
    );
    const hook = readFileSync(
      join(process.cwd(), "components/cleaning/useCleaningCalculator.ts"),
      "utf8"
    );
    const i18n = readFileSync(join(process.cwd(), "lib/cleaning/i18n.ts"), "utf8");

    assert.match(summary, /cleaning-price-month-net/);
    assert.match(summary, /netPerMonth/);
    assert.match(summary, /monthNote/);
    assert.match(calcUi, /cleaning-price-month-net-mobile/);
    assert.match(hook, /monthlyNetCents/);
    assert.match(i18n, /netPerMonth:\s*"ca\. netto \/ Monat"/);
    assert.match(i18n, /52 Wochen/);
  });
});
