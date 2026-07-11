import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeCapacity, countsTowardCapacity } from "./capacity";
import type { CalendarAppointment } from "./types";

function appt(id: string, date: string, overrides: Partial<CalendarAppointment> = {}): CalendarAppointment {
  return {
    id,
    leadId: "l",
    role: "confirmed",
    kind: "single",
    status: "bestätigt",
    eventDate: date,
    customerName: overrides.customerName ?? `Customer ${id}`,
    title: "T",
    ...overrides,
  };
}

describe("capacity", () => {
  it("counts only active appointments", () => {
    assert.equal(countsTowardCapacity(appt("1", "2026-03-10")), true);
    assert.equal(countsTowardCapacity(appt("2", "2026-03-10", { status: "erledigt" })), false);
    assert.equal(countsTowardCapacity(appt("3", "2026-03-10", { status: "storniert" })), false);
  });

  it("flags over-capacity days", () => {
    const day = "2026-03-10";
    const items = Array.from({ length: 7 }, (_, i) => appt(String(i), day));
    const report = analyzeCapacity(items, [day], { maxPerDay: 6, maxPerSlot: 3 });
    assert.equal(report.overCapacityDays.length, 1);
    assert.equal(report.overCapacityDays[0].count, 7);
  });

  it("flags duplicate customer same day", () => {
    const day = "2026-03-10";
    const items = [
      appt("1", day, { customerPhone: "+49111", customerName: "Anna" }),
      appt("2", day, { customerPhone: "+49111", customerName: "Anna" }),
    ];
    const report = analyzeCapacity(items, [day], { maxPerDay: 10, maxPerSlot: 5 });
    assert.equal(report.duplicateWarnings.length, 1);
  });
});
