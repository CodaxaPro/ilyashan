import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  alignToPreferredWeekday,
  generateWartungSeriesDates,
  intervalDaysForPackage,
  isWartungSeriesRole,
  maxSeriesVisitsForPackage,
  wartungSeriesRole,
} from "./wartung-series";

describe("wartung-series", () => {
  it("computes interval from package visits per year", () => {
    assert.equal(intervalDaysForPackage("weekly"), 7);
    assert.equal(intervalDaysForPackage("four_weekly"), 28);
    assert.equal(intervalDaysForPackage("quarterly"), 91);
  });

  it("aligns to preferred weekday", () => {
    assert.equal(alignToPreferredWeekday("2026-03-09", "di"), "2026-03-10");
    assert.equal(alignToPreferredWeekday("2026-03-10", "di"), "2026-03-10");
  });

  it("generates spaced future dates for four_weekly package", () => {
    const dates = generateWartungSeriesDates({
      anchorDate: "2026-03-10",
      packageId: "four_weekly",
      preferredWeekday: "di",
    });
    assert.ok(dates.length >= 10);
    assert.ok(dates.every((d) => d > "2026-03-10"));
    assert.equal(dates[0], "2026-04-07");
  });

  it("caps visits by horizon and package", () => {
    const max = maxSeriesVisitsForPackage("quarterly", 12);
    assert.equal(max, 4);
    const dates = generateWartungSeriesDates({
      anchorDate: "2026-01-15",
      packageId: "quarterly",
      preferredWeekday: "fr",
      horizonMonths: 12,
    });
    assert.equal(dates.length, 4);
  });

  it("identifies wartung series roles", () => {
    assert.equal(isWartungSeriesRole("wartung-0"), true);
    assert.equal(isWartungSeriesRole("confirmed"), false);
    assert.equal(wartungSeriesRole(3), "wartung-3");
  });
});
