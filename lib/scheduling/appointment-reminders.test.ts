import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildReminderAppointmentPatch,
  findReminderCandidates,
  isReminderEligibleLead,
  needsReminderForDate,
} from "./appointment-reminders";
import type { StoredLead } from "@/lib/leads-store";
import { calculateTreppenhausQuote } from "@/lib/treppenhaus/pricing";

function lead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-1",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Anna",
    email: "anna@test.de",
    summary: "x",
    photoCount: 0,
    status: "termin_bestaetigt",
    quote: { windowCount: 10, firstName: "Anna" },
    appointment: {
      confirmedDate: "2026-07-13",
      plannedStartTime: "09:30",
      estimatedDurationHours: 2.5,
    },
    ...overrides,
  };
}

describe("appointment reminders", () => {
  it("detects when reminder already sent for date", () => {
    assert.equal(needsReminderForDate(undefined, "2026-07-13"), true);
    assert.equal(
      needsReminderForDate({ reminderEmail: { sentAt: "x", forDate: "2026-07-13" } }, "2026-07-13"),
      false
    );
    assert.equal(
      needsReminderForDate({ reminderEmail: { sentAt: "x", forDate: "2026-07-12" } }, "2026-07-13"),
      true
    );
  });

  it("finds eligible leads for target date", () => {
    const candidates = findReminderCandidates(
      [
        lead(),
        lead({ id: "2", appointment: { confirmedDate: "2026-07-14" } }),
        lead({ id: "3", email: "" }),
        lead({
          id: "4",
          appointment: {
            confirmedDate: "2026-07-13",
            reminderEmail: { sentAt: "2026-01-01", forDate: "2026-07-13" },
          },
        }),
      ],
      "2026-07-13"
    );
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].lead.id, "lead-1");
  });

  it("rejects terminal statuses", () => {
    assert.equal(isReminderEligibleLead(lead({ status: "abgeschlossen" }), "2026-07-13").eligible, false);
  });

  it("builds reminder patch", () => {
    const patch = buildReminderAppointmentPatch(
      { confirmedDate: "2026-07-13" },
      "2026-07-13",
      "eve",
      "2026-07-12T16:00:00.000Z"
    );
    assert.equal(patch.reminderEmail?.forDate, "2026-07-13");
    assert.equal(patch.reminderEmail?.sentAt, "2026-07-12T16:00:00.000Z");
    assert.equal(patch.confirmedDate, "2026-07-13");
  });

  it("supports morning wave separately from eve", () => {
    const afterEve = lead({
      appointment: {
        confirmedDate: "2026-07-13",
        reminderEmail: { sentAt: "x", forDate: "2026-07-13" },
      },
    });
    assert.equal(isReminderEligibleLead(afterEve, "2026-07-13", "eve").eligible, false);
    assert.equal(isReminderEligibleLead(afterEve, "2026-07-13", "morning").eligible, true);

    const morningPatch = buildReminderAppointmentPatch(
      afterEve.appointment,
      "2026-07-13",
      "morning",
      "2026-07-13T05:00:00.000Z"
    );
    assert.equal(morningPatch.morningReminderEmail?.forDate, "2026-07-13");
  });

  it("includes treppenhaus bookable leads", () => {
    const input = {
      stockwerke: 4,
      wohnungen: 8,
      stairTurnus: "biweekly" as const,
      dirtLevel: "normal" as const,
      keller: false,
      kellerTurnus: "monthly" as const,
      aufzug: false,
      glasHandlauf: false,
    };
    const trp = lead({
      id: "trp",
      serviceLine: "treppenhaus",
      quote: { firstName: "Anna" },
      treppenhausSnapshot: {
        quoteReference: "TRP-1",
        capturedAt: "2026-01-01T00:00:00.000Z",
        input,
        quote: calculateTreppenhausQuote(input),
        contact: {
          name: "Anna",
          email: "anna@test.de",
          phone: "0173",
          postalCode: "52499",
          city: "Baesweiler",
          privacyAccepted: true,
        },
      },
    });
    const candidates = findReminderCandidates([trp], "2026-07-13");
    assert.equal(candidates.length, 1);
  });
});
