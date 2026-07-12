import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STAFF_CONFIG } from "../staff/config";
import {
  buildOccupancyFromLeads,
  buildDayAvailability,
  isSlotAvailable,
  pickStaffForSlot,
} from "./slot-engine";
import type { StoredLead } from "../leads-store";

function quoteLead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-1",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Test",
    summary: "x",
    photoCount: 0,
    quote: { windowCount: 8 },
    ...overrides,
  };
}

describe("slot engine", () => {
  it("builds occupancy only from proposed/confirmed dates", () => {
    const leads = [
      quoteLead({
        appointment: { confirmedDate: "2026-04-10" },
        quote: { windowCount: 8, preferredDates: ["2026-04-12"] },
      }),
    ];
    const occ = buildOccupancyFromLeads(leads);
    assert.equal(occ.length, 1);
    assert.equal(occ[0].eventDate, "2026-04-10");
  });

  it("respects per-staff daily limits", () => {
    const config = {
      ...DEFAULT_STAFF_CONFIG,
      members: [
        {
          id: "team-1",
          name: "Ekip 1",
          color: "#000",
          active: true,
          workDays: [1, 2, 3, 4, 5, 6],
          maxJobsPerDay: 1,
          maxJobsPerSlot: 1,
        },
      ],
      teamMaxJobsPerDay: 0,
      teamMaxJobsPerSlot: 0,
    };

    const leads = [
      quoteLead({
        id: "a",
        appointment: { confirmedDate: "2026-04-13", staffId: "team-1", timeSlot: "vormittag" },
      }),
    ];
    const occ = buildOccupancyFromLeads(leads);
    const check = isSlotAvailable(config, occ, "2026-04-13", "vormittag", { staffId: "team-1" });
    assert.equal(check.available, false);
  });

  it("auto-picks least loaded staff", () => {
    const config = DEFAULT_STAFF_CONFIG;
    const leads = [
      quoteLead({
        id: "a",
        appointment: { confirmedDate: "2026-04-14", staffId: "team-1", timeSlot: "vormittag" },
      }),
    ];
    const occ = buildOccupancyFromLeads(leads);
    const picked = pickStaffForSlot(config, occ, "2026-04-14", "vormittag");
    assert.equal(picked, "team-2");
  });

  it("excludes current lead from occupancy checks", () => {
    const config = DEFAULT_STAFF_CONFIG;
    const leads = [
      quoteLead({
        id: "self",
        appointment: { proposedDate: "2026-04-15", timeSlot: "nachmittag" },
      }),
    ];
    const occ = buildOccupancyFromLeads(leads);
    const day = buildDayAvailability(config, occ, "2026-04-15", { excludeLeadId: "self" });
    assert.equal(day.available, true);
  });

  it("includes wartung series in occupancy for confirmed contracts", () => {
    const leads = [
      quoteLead({
        status: "termin_bestaetigt",
        appointment: { confirmedDate: "2026-03-10", timeSlot: "vormittag" },
        quote: {
          windowCount: 8,
          services: ["privat", "wartung"],
          wartungPackageId: "quarterly",
          wartungPreferredWeekday: "di",
        },
      }),
    ];
    const occ = buildOccupancyFromLeads(leads);
    assert.ok(occ.some((o) => o.role === "confirmed"));
    assert.ok(occ.some((o) => o.role === "wartung-0"));
    assert.ok(occ.length > 1);
  });
});
