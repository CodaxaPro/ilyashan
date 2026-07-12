import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerArrivalOptions,
  deriveTimeSlotFromStartTime,
  findCustomerArrivalOption,
  isCustomerArrivalTimeAllowed,
} from "./customer-arrival-options";
import type { DayAvailability } from "./slot-engine";

function day(slots: DayAvailability["slots"]): DayAvailability {
  return {
    date: "2026-05-20",
    weekday: 2,
    available: slots.some((s) => s.available),
    slots,
    totalRemaining: 1,
  };
}

describe("customer arrival options", () => {
  it("derives vormittag and nachmittag from hour", () => {
    assert.equal(deriveTimeSlotFromStartTime("09:30"), "vormittag");
    assert.equal(deriveTimeSlotFromStartTime("14:00"), "nachmittag");
    assert.equal(deriveTimeSlotFromStartTime("23:15"), null);
    assert.equal(deriveTimeSlotFromStartTime("12:30"), null);
  });

  it("builds grouped options only for available slots", () => {
    const options = buildCustomerArrivalOptions(
      day([
        { timeSlot: "vormittag", available: true, remainingCapacity: 2 },
        { timeSlot: "nachmittag", available: false, remainingCapacity: 0 },
        { timeSlot: "flexibel", available: true, remainingCapacity: 1 },
      ])
    );
    assert.ok(options.some((o) => o.id === "09:00" && o.groupDe === "Vormittag"));
    assert.ok(!options.some((o) => o.id === "14:00"));
    assert.ok(options.some((o) => o.id === "flexibel"));
  });

  it("rejects invalid customer times", () => {
    assert.equal(isCustomerArrivalTimeAllowed("23:15"), false);
    assert.equal(isCustomerArrivalTimeAllowed("09:45"), true);
  });

  it("finds option by id", () => {
    const d = day([
      { timeSlot: "vormittag", available: true, remainingCapacity: 1 },
      { timeSlot: "nachmittag", available: true, remainingCapacity: 1 },
      { timeSlot: "flexibel", available: true, remainingCapacity: 1 },
    ]);
    const found = findCustomerArrivalOption(d, "10:30");
    assert.equal(found?.timeSlot, "vormittag");
    assert.equal(found?.startTime, "10:30");
  });
});
