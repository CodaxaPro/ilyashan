import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareAppointments, sortAppointmentsForDay } from "./sort";
import type { CalendarAppointment } from "./types";

function appt(
  overrides: Partial<CalendarAppointment> & Pick<CalendarAppointment, "id">
): CalendarAppointment {
  return {
    leadId: "l",
    role: "confirmed",
    kind: "single",
    status: "bestätigt",
    eventDate: "2026-03-10",
    customerName: overrides.customerName ?? "Anna",
    title: "T",
    ...overrides,
  };
}

describe("calendar sort", () => {
  it("sorts by time slot then role", () => {
    const sorted = sortAppointmentsForDay([
      appt({ id: "a", timeSlot: "nachmittag", role: "confirmed" }),
      appt({ id: "b", timeSlot: "vormittag", role: "proposed" }),
      appt({ id: "c", timeSlot: "vormittag", role: "confirmed" }),
    ]);
    assert.deepEqual(sorted.map((i) => i.id), ["c", "b", "a"]);
  });

  it("sorts same day by customer name", () => {
    assert.ok(compareAppointments(appt({ id: "a", customerName: "Anna" }), appt({ id: "b", customerName: "Zoe" })) < 0);
  });
});
