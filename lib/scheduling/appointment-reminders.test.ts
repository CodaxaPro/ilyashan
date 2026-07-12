import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildReminderAppointmentPatch,
  findReminderCandidates,
  isReminderEligibleLead,
  needsReminderForDate,
} from "./appointment-reminders";
import type { StoredLead } from "@/lib/leads-store";

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
    const patch = buildReminderAppointmentPatch({ confirmedDate: "2026-07-13" }, "2026-07-13", "2026-07-12T16:00:00.000Z");
    assert.equal(patch.reminderEmail?.forDate, "2026-07-13");
    assert.equal(patch.confirmedDate, "2026-07-13");
  });
});
