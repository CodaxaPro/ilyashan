import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildRangeStats, statsForDay } from "./stats";
import type { CalendarAppointment } from "./types";

describe("calendar stats", () => {
  it("counts per day stats", () => {
    const stats = statsForDay([
      {
        id: "1",
        leadId: "l",
        role: "confirmed",
        kind: "wartung",
        status: "bestätigt",
        eventDate: "2026-03-10",
        customerName: "A",
        title: "T",
      },
      {
        id: "2",
        leadId: "l",
        role: "proposed",
        kind: "single",
        status: "vorgeschlagen",
        eventDate: "2026-03-10",
        customerName: "B",
        title: "T",
      },
    ]);
    assert.equal(stats.total, 2);
    assert.equal(stats.wartung, 1);
    assert.equal(stats.bestätigt, 1);
  });

  it("finds busiest day in range", () => {
    const items = [
      {
        id: "1",
        leadId: "l",
        role: "confirmed" as const,
        kind: "single" as const,
        status: "bestätigt" as const,
        eventDate: "2026-03-10",
        customerName: "A",
        title: "T",
      },
      {
        id: "2",
        leadId: "l",
        role: "confirmed" as const,
        kind: "single" as const,
        status: "bestätigt" as const,
        eventDate: "2026-03-11",
        customerName: "B",
        title: "T",
      },
      {
        id: "3",
        leadId: "l",
        role: "confirmed" as const,
        kind: "single" as const,
        status: "bestätigt" as const,
        eventDate: "2026-03-11",
        customerName: "C",
        title: "T",
      },
    ];
    const range = buildRangeStats(items, ["2026-03-10", "2026-03-11"]);
    assert.equal(range.busiestDay, "2026-03-11");
    assert.equal(range.byDay["2026-03-11"].total, 2);
  });
});
