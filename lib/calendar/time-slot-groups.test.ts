import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupAppointmentsByTimeSlot } from "./time-slot-groups";
import type { CalendarAppointment } from "./types";

function appt(timeSlot?: CalendarAppointment["timeSlot"]): CalendarAppointment {
  return {
    id: "1",
    leadId: "l1",
    role: "confirmed",
    kind: "single",
    status: "bestätigt",
    eventDate: "2026-03-10",
    customerName: "Anna",
    title: "Anna",
    timeSlot,
  };
}

describe("time slot groups", () => {
  it("groups appointments by time slot in order", () => {
    const groups = groupAppointmentsByTimeSlot([
      appt("nachmittag"),
      appt("vormittag"),
      appt("flexibel"),
    ]);
    assert.equal(groups.length, 3);
    assert.equal(groups[0].section?.key, "vormittag");
    assert.equal(groups[1].section?.key, "nachmittag");
    assert.equal(groups[2].section?.key, "flexibel");
  });

  it("puts items without slot in none section", () => {
    const groups = groupAppointmentsByTimeSlot([appt()]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].section?.key, "_none");
  });
});
