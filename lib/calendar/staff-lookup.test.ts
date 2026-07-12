import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STAFF_CONFIG } from "@/lib/staff/config";
import {
  buildStaffMap,
  countAppointmentsByStaff,
  resolveStaffMember,
  toStaffSummaries,
} from "./staff-lookup";

describe("staff lookup", () => {
  it("resolves staff member by id", () => {
    const members = toStaffSummaries(DEFAULT_STAFF_CONFIG);
    const member = resolveStaffMember("team-1", members);
    assert.equal(member?.name, "Ekip 1");
    assert.equal(member?.color, "#0369a1");
  });

  it("returns null for unknown staff", () => {
    const members = toStaffSummaries(DEFAULT_STAFF_CONFIG);
    assert.equal(resolveStaffMember("missing", members), null);
  });

  it("counts appointments per staff", () => {
    const members = toStaffSummaries(DEFAULT_STAFF_CONFIG);
    const counts = countAppointmentsByStaff(
      [
        { staffId: "team-1" },
        { staffId: "team-1" },
        { staffId: "team-2" },
        {},
      ],
      members
    );
    assert.equal(counts["team-1"], 2);
    assert.equal(counts["team-2"], 1);
    assert.equal(counts.unassigned, 1);
  });

  it("builds staff map", () => {
    const members = toStaffSummaries(DEFAULT_STAFF_CONFIG);
    const map = buildStaffMap(members);
    assert.equal(map.get("team-2")?.name, "Ekip 2");
  });
});
