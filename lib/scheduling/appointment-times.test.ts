import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildArrivalLinesDe,
  computePlannedEndTime,
  formatDurationDe,
  formatTimeDe,
  normalizeTimeInput,
  resolveAppointmentTimePlan,
  suggestDefaultStartForSlot,
} from "./appointment-times";

describe("appointment-times", () => {
  it("normalizes HH:mm times", () => {
    assert.equal(normalizeTimeInput("9:45"), "09:45");
    assert.equal(normalizeTimeInput("25:00"), undefined);
  });

  it("computes planned end from start and duration", () => {
    assert.equal(computePlannedEndTime("09:30", 2.5), "12:00");
    assert.equal(computePlannedEndTime("13:00", 1.5), "14:30");
  });

  it("formats German labels", () => {
    assert.equal(formatTimeDe("09:30"), "09:30 Uhr");
    assert.equal(formatDurationDe(2.5), "ca. 2,5 Stunden");
  });

  it("suggests default start per slot", () => {
    assert.equal(suggestDefaultStartForSlot("vormittag"), "09:00");
    assert.equal(suggestDefaultStartForSlot("nachmittag"), "13:00");
    assert.equal(suggestDefaultStartForSlot("flexibel"), undefined);
  });

  it("builds arrival lines with planned start and duration", () => {
    const plan = resolveAppointmentTimePlan(
      { plannedStartTime: "09:30", estimatedDurationHours: 2.5 },
      10
    );
    const lines = buildArrivalLinesDe("15.03.2026", plan);
    assert.match(lines.join("\n"), /Ankunft: gegen 09:30 Uhr/);
    assert.match(lines.join("\n"), /Voraussichtliche Dauer/);
    assert.match(lines.join("\n"), /Voraussichtliches Ende/);
  });

  it("shows preferred time as unverbindlich when no planned start", () => {
    const plan = resolveAppointmentTimePlan({ preferredStartTime: "09:45" }, 8);
    const lines = buildArrivalLinesDe("15.03.2026", plan, { includePreferredNote: true });
    assert.match(lines.join("\n"), /Wunsch-Uhrzeit/);
    assert.match(lines.join("\n"), /09:45 Uhr/);
  });
});
