import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addDaysIso, toIsoDate } from "@/lib/calendar/week-range";
import type { StoredLead } from "@/lib/leads-store";
import {
  buildTerminPortalSummary,
  canCustomerReschedule,
  LEAD_STATUS_LABELS_DE,
} from "./termin-portal";

function lead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-1",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Anna Test",
    email: "anna@test.de",
    summary: "x",
    photoCount: 0,
    quote: { windowCount: 10, services: ["privat"], postalCode: "40213", city: "Düsseldorf" },
    priceSnapshot: { priceLabel: "ab 120 €", amount: 120, min: 120, max: 150, calculatedSubtotal: 120, minimumApplied: false, minimumAmount: 80, capturedAt: "2026-01-01", pricing: {}, wartungConfig: {}, wartungPackages: [] },
    ...overrides,
  };
}

describe("termin portal", () => {
  it("builds German status summary", () => {
    const summary = buildTerminPortalSummary(lead({ status: "termin_bestaetigt" }));
    assert.ok(summary);
    assert.equal(summary.statusLabelDe, LEAD_STATUS_LABELS_DE.termin_bestaetigt);
    assert.equal(summary.priceLabel, "ab 120 €");
    assert.equal(summary.windowCount, 10);
  });

  it("allows reschedule for future confirmed dates", () => {
    const future = addDaysIso(toIsoDate(new Date()), 10);
    assert.equal(
      canCustomerReschedule(lead({ status: "termin_bestaetigt", appointment: { confirmedDate: future } })),
      true
    );
  });

  it("blocks reschedule for past dates", () => {
    assert.equal(
      canCustomerReschedule(lead({ status: "termin_bestaetigt", appointment: { confirmedDate: "2020-01-01" } })),
      false
    );
  });
});
