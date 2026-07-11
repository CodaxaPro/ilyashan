import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeStaffConfig, DEFAULT_STAFF_CONFIG } from "./config";

describe("staff config", () => {
  it("sanitizes invalid numbers", () => {
    const cfg = sanitizeStaffConfig({
      teamMaxJobsPerDay: 99,
      teamMaxJobsPerSlot: -1,
      members: [{ ...DEFAULT_STAFF_CONFIG.members[0], maxJobsPerDay: 0 }],
    });
    assert.equal(cfg.teamMaxJobsPerDay, 20);
    assert.equal(cfg.teamMaxJobsPerSlot, 1);
    assert.equal(cfg.members[0].maxJobsPerDay, 1);
  });

  it("defaults to two active teams", () => {
    const cfg = sanitizeStaffConfig(undefined);
    assert.equal(cfg.members.length, 2);
    assert.equal(cfg.autoAssign, true);
  });
});
