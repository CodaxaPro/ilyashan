import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getMonthRange,
  shiftMonth,
  parseMonthParam,
  formatMonthLabel,
  groupDaysIntoWorkWeekRows,
  isToday,
} from "./month-range";
import { toIsoDate } from "./week-range";

describe("month-range", () => {
  it("returns Mon-Sat days for March 2026", () => {
    const month = getMonthRange(2026, 3);
    assert.ok(month.days.length >= 26);
    assert.equal(month.days[0], "2026-03-02");
    assert.ok(!month.days.some((d) => new Date(d + "T12:00:00").getDay() === 0));
    assert.equal(formatMonthLabel(2026, 3), "Mart 2026");
  });

  it("groups days into padded week rows", () => {
    const month = getMonthRange(2026, 3);
    assert.ok(month.weeks.length >= 4);
    assert.equal(month.weeks[0].cells.length, 6);
    assert.equal(month.weeks[0].cells[0], "2026-03-02");
  });

  it("shifts month with year rollover", () => {
    assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
    assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  });

  it("parses YYYY-MM param", () => {
    assert.deepEqual(parseMonthParam("2026-07"), { year: 2026, month: 7 });
    assert.equal(parseMonthParam("2026-13"), null);
    assert.equal(parseMonthParam("bad"), null);
  });

  it("detects today", () => {
    const today = toIsoDate(new Date());
    assert.equal(isToday(today, today), true);
    assert.equal(isToday("2020-01-01", today), false);
  });

  it("groupDaysIntoWorkWeekRows splits on monday", () => {
    const rows = groupDaysIntoWorkWeekRows(["2026-03-02", "2026-03-03", "2026-03-09"]);
    assert.equal(rows.length, 2);
  });
});
