import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildRescheduleLeadUpdate,
  resolvePreviousAppointmentDate,
} from "./reschedule-lead";
import type { StoredLead } from "../leads-store";
import type { CalendarAppointment } from "./types";

function lead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-1",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Anna",
    email: "anna@example.com",
    summary: "Test",
    photoCount: 0,
    status: "neu",
    quote: { windowCount: 8 },
    ...overrides,
  };
}

function appointment(overrides: Partial<CalendarAppointment> = {}): CalendarAppointment {
  return {
    id: "local-lead-1-confirmed",
    leadId: "lead-1",
    role: "confirmed",
    kind: "single",
    status: "bestätigt",
    eventDate: "2026-03-10",
    customerName: "Anna",
    title: "Anna · 8 Flügel",
    ...overrides,
  };
}

describe("resolvePreviousAppointmentDate", () => {
  it("reads confirmed date from lead", () => {
    const l = lead({ appointment: { confirmedDate: "2026-03-15" } });
    assert.equal(
      resolvePreviousAppointmentDate(l, appointment({ role: "confirmed" })),
      "2026-03-15"
    );
  });

  it("reads proposed date from lead", () => {
    const l = lead({ appointment: { proposedDate: "2026-03-20" } });
    assert.equal(
      resolvePreviousAppointmentDate(l, appointment({ role: "proposed", status: "vorgeschlagen" })),
      "2026-03-20"
    );
  });

  it("falls back to appointment eventDate for preferred roles", () => {
    const l = lead();
    assert.equal(
      resolvePreviousAppointmentDate(
        l,
        appointment({ role: "preferred-0", status: "vorgeschlagen", eventDate: "2026-04-01" })
      ),
      "2026-04-01"
    );
  });
});

describe("buildRescheduleLeadUpdate", () => {
  const fixedNow = new Date("2026-03-01T09:00:00.000Z");

  it("updates confirmed date and sets termin_bestaetigt", () => {
    const result = buildRescheduleLeadUpdate(
      lead({ status: "kontaktiert" }),
      appointment({ role: "confirmed" }),
      "2026-03-22",
      fixedNow
    );
    assert.equal(result.appointment.confirmedDate, "2026-03-22");
    assert.equal(result.appointment.confirmedAt, fixedNow.toISOString());
    assert.equal(result.status, "termin_bestaetigt");
  });

  it("updates proposed date only", () => {
    const result = buildRescheduleLeadUpdate(
      lead({ status: "termin_vorgeschlagen", appointment: { proposedDate: "2026-03-10" } }),
      appointment({ role: "proposed", status: "vorgeschlagen" }),
      "2026-03-18",
      fixedNow
    );
    assert.equal(result.appointment.proposedDate, "2026-03-18");
    assert.equal(result.appointment.confirmedDate, undefined);
    assert.equal(result.status, "termin_bestaetigt");
  });

  it("keeps abgeschlossen status when moving confirmed appointment", () => {
    const result = buildRescheduleLeadUpdate(
      lead({ status: "abgeschlossen", appointment: { confirmedDate: "2026-03-10" } }),
      appointment({ role: "confirmed" }),
      "2026-03-25",
      fixedNow
    );
    assert.equal(result.status, "abgeschlossen");
  });

  it("does not touch dates for preferred role moves", () => {
    const result = buildRescheduleLeadUpdate(
      lead(),
      appointment({ role: "preferred-1", status: "vorgeschlagen" }),
      "2026-03-30",
      fixedNow
    );
    assert.equal(result.appointment.confirmedDate, undefined);
    assert.equal(result.appointment.proposedDate, undefined);
  });
});
