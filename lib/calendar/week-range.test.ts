import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getWeekRange,
  shiftWeek,
  formatWeekLabel,
  weekdayLabelTr,
  groupAppointmentsByDate,
  isDateInRange,
  toIsoDate,
  parseIsoDate,
} from "./week-range";

describe("week-range", () => {
  it("returns monday-saturday week with 6 days", () => {
    const week = getWeekRange(new Date("2026-03-11T12:00:00"));
    assert.equal(week.days.length, 6);
    assert.match(week.start, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(week.end >= week.start);
  });

  it("shifts week by delta", () => {
    const week = getWeekRange(new Date("2026-03-11T12:00:00"));
    const next = shiftWeek(week.start, 1);
    assert.notEqual(next, week.start);
    const prev = shiftWeek(next, -1);
    assert.equal(prev, week.start);
  });

  it("formats week label in Turkish locale", () => {
    const label = formatWeekLabel("2026-03-09", "2026-03-14");
    assert.match(label, /2026/);
    assert.match(label, /–/);
  });

  it("maps weekday labels", () => {
    assert.equal(weekdayLabelTr("2026-03-09"), "Pzt");
    assert.equal(weekdayLabelTr("2026-03-14"), "Cmt");
  });

  it("checks date in range inclusively", () => {
    assert.equal(isDateInRange("2026-03-10", "2026-03-09", "2026-03-14"), true);
    assert.equal(isDateInRange("2026-03-15", "2026-03-09", "2026-03-14"), false);
  });

  it("groups appointments by day", () => {
    const days = ["2026-03-09", "2026-03-10"];
    const grouped = groupAppointmentsByDate(
      [
        { eventDate: "2026-03-10", id: "a" },
        { eventDate: "2026-03-09", id: "b" },
      ],
      days
    );
    assert.equal(grouped["2026-03-09"].length, 1);
    assert.equal(grouped["2026-03-10"].length, 1);
    assert.equal(grouped["2026-03-09"][0].id, "b");
  });

  it("round-trips iso dates", () => {
    const iso = "2026-07-09";
    assert.equal(toIsoDate(parseIsoDate(iso)), iso);
  });

  it("week starts on monday even when anchor is sunday", () => {
    const week = getWeekRange(new Date("2026-03-15T12:00:00"));
    assert.equal(weekdayLabelTr(week.start), "Pzt");
    assert.equal(week.days.length, 6);
  });

  it("excludes sunday from working week", () => {
    const week = getWeekRange(new Date("2026-03-11T12:00:00"));
    assert.ok(!week.days.some((d) => weekdayLabelTr(d) === "Paz"));
  });
});
