import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bucketForDate,
  buildUpcomingSummary,
  groupUpcomingAppointments,
  isActionableUpcoming,
} from "./upcoming";
import type { CalendarAppointment } from "./types";

function appt(date: string, status: CalendarAppointment["status"] = "bestätigt"): CalendarAppointment {
  return {
    id: date,
    leadId: "l",
    role: "confirmed",
    kind: "single",
    status,
    eventDate: date,
    customerName: "Test",
    title: "T",
  };
}

describe("upcoming", () => {
  const today = "2026-03-10";

  it("buckets dates relative to today", () => {
    assert.equal(bucketForDate("2026-03-09", today), "overdue");
    assert.equal(bucketForDate("2026-03-10", today), "today");
    assert.equal(bucketForDate("2026-03-11", today), "tomorrow");
    assert.equal(bucketForDate("2026-03-14", today), "week");
    assert.equal(bucketForDate("2026-03-20", today), "later");
  });

  it("builds summary with badge count", () => {
    const summary = buildUpcomingSummary(
      [appt("2026-03-09"), appt("2026-03-10"), appt("2026-03-11"), appt("2026-03-20")],
      today
    );
    assert.equal(summary.overdue, 1);
    assert.equal(summary.today, 1);
    assert.equal(summary.tomorrow, 1);
    assert.equal(summary.badgeCount, 3);
  });

  it("excludes erledigt and storniert from groups", () => {
    const groups = groupUpcomingAppointments(
      [appt("2026-03-10", "erledigt"), appt("2026-03-11", "storniert"), appt("2026-03-11")],
      today
    );
    assert.equal(groups.flatMap((g) => g.items).length, 1);
  });

  it("actionable window is 14 days", () => {
    assert.equal(isActionableUpcoming(appt("2026-03-24"), today), true);
    assert.equal(isActionableUpcoming(appt("2026-03-26"), today), false);
  });
});
