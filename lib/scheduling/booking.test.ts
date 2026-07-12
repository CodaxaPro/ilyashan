import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STAFF_CONFIG } from "../staff/config";
import { applyCustomerBooking } from "./booking";
import type { StoredLead } from "../leads-store";

function lead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-1",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Anna",
    email: "anna@test.de",
    summary: "x",
    photoCount: 0,
    status: "termin_vorgeschlagen",
    quote: { windowCount: 10 },
    appointment: { proposedDate: "2026-05-12", timeSlot: "vormittag" },
    ...overrides,
  };
}

describe("customer booking", () => {
  it("confirms proposed date when capacity available", () => {
    const result = applyCustomerBooking(lead(), DEFAULT_STAFF_CONFIG, [lead()], {
      action: "confirm_proposed",
    });
    assert.equal(result.ok, true);
    assert.equal(result.status, "termin_bestaetigt");
    assert.equal(result.appointment?.confirmedDate, "2026-05-12");
    assert.equal(result.appointment?.proposedDate, undefined);
    assert.ok(result.appointment?.staffId);
  });

  it("books alternative slot", () => {
    const result = applyCustomerBooking(lead({ appointment: {} }), DEFAULT_STAFF_CONFIG, [], {
      action: "pick_slot",
      date: "2026-05-20",
      timeSlot: "nachmittag",
    });
    assert.equal(result.ok, true);
    assert.equal(result.appointment?.confirmedDate, "2026-05-20");
    assert.equal(result.appointment?.timeSlot, "nachmittag");
  });

  it("stores customer preferred start time on pick_slot", () => {
    const result = applyCustomerBooking(lead({ appointment: {} }), DEFAULT_STAFF_CONFIG, [], {
      action: "pick_slot",
      date: "2026-05-20",
      timeSlot: "nachmittag",
      preferredStartTime: "09:45",
    });
    assert.equal(result.ok, true);
    assert.equal(result.appointment?.preferredStartTime, "09:45");
  });
});
