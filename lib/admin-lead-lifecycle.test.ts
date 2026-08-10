import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getLeadDeletePolicy, isLeadArchived } from "./admin-lead-lifecycle";

describe("admin-lead-lifecycle", () => {
  it("requires force for confirmed appointments", () => {
    const policy = getLeadDeletePolicy({
      status: "termin_bestaetigt",
      appointment: { confirmedDate: "2026-09-01" },
    });
    assert.equal(policy.allowed, true);
    assert.equal(policy.requiresForce, true);
  });

  it("simple delete for neu leads", () => {
    const policy = getLeadDeletePolicy({ status: "neu" });
    assert.equal(policy.requiresForce, false);
  });

  it("detects archive flag", () => {
    assert.equal(isLeadArchived({}), false);
    assert.equal(isLeadArchived({ archivedAt: "2026-01-01T00:00:00.000Z" }), true);
  });
});
