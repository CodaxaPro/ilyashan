import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isLocalAppointmentId,
  parseLocalAppointmentId,
  LOCAL_APPOINTMENT_ROLES,
} from "./local-appointment-id";

describe("parseLocalAppointmentId", () => {
  it("parses all supported roles with hyphenated lead ids", () => {
    const leadId = "quote-1739123456-abc12";
    for (const role of LOCAL_APPOINTMENT_ROLES) {
      const id = `local-${leadId}-${role}`;
      assert.deepEqual(parseLocalAppointmentId(id), { leadId, role });
      assert.equal(isLocalAppointmentId(id), true);
    }
  });

  it("returns null for supabase uuid ids", () => {
    assert.equal(parseLocalAppointmentId("550e8400-e29b-41d4-a716-446655440000"), null);
    assert.equal(isLocalAppointmentId("550e8400-e29b-41d4-a716-446655440000"), false);
  });

  it("returns null for malformed local ids", () => {
    assert.equal(parseLocalAppointmentId("local-"), null);
    assert.equal(parseLocalAppointmentId("local-lead-unknown-role"), null);
    assert.equal(parseLocalAppointmentId("not-local-lead-confirmed"), null);
  });

  it("parses wartung series roles", () => {
    const leadId = "quote-1739123456-abc12";
    assert.deepEqual(parseLocalAppointmentId(`local-${leadId}-wartung-3`), {
      leadId,
      role: "wartung-3",
    });
  });
});
