import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getPrimaryEmailActionLabel,
  resolveEmailActionForSave,
  resolveLeadUpdate,
} from "./lead-workflow";
import type { StoredLead } from "./leads-store";

function sampleLead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-1",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Max Mustermann",
    email: "max@example.com",
    summary: "Test",
    photoCount: 0,
    status: "neu",
    quote: { windowCount: 10 },
    ...overrides,
  };
}

describe("resolveLeadUpdate", () => {
  it("respects explicit abgelehnt status and clears confirmed date", () => {
    const lead = sampleLead({
      status: "termin_bestaetigt",
      appointment: { confirmedDate: "2026-03-15" },
    });

    const result = resolveLeadUpdate(lead, {
      status: "abgelehnt",
      confirmedDate: "2026-03-15",
      emailAction: "none",
    });

    assert.equal(result.status, "abgelehnt");
    assert.equal(result.appointment.confirmedDate, undefined);
  });

  it("sets termin_bestaetigt on confirm email action", () => {
    const result = resolveLeadUpdate(sampleLead(), {
      confirmedDate: "2026-04-01",
      emailAction: "confirm",
    });
    assert.equal(result.status, "termin_bestaetigt");
    assert.equal(result.appointment.confirmedDate, "2026-04-01");
  });

  it("allows editing confirmed date without forcing wrong status when saving only", () => {
    const lead = sampleLead({
      status: "termin_bestaetigt",
      appointment: { confirmedDate: "2026-03-15" },
    });

    const result = resolveLeadUpdate(lead, {
      status: "termin_bestaetigt",
      confirmedDate: "2026-03-22",
      emailAction: "none",
    });

    assert.equal(result.status, "termin_bestaetigt");
    assert.equal(result.appointment.confirmedDate, "2026-03-22");
  });

  it("sets termin_vorgeschlagen on propose email action", () => {
    const result = resolveLeadUpdate(sampleLead(), {
      proposedDate: "2026-05-10",
      emailAction: "propose",
    });
    assert.equal(result.status, "termin_vorgeschlagen");
    assert.equal(result.appointment.proposedDate, "2026-05-10");
  });
});

describe("resolveEmailActionForSave", () => {
  it("maps update to confirm when no previous confirmed date", () => {
    const action = resolveEmailActionForSave(sampleLead(), {
      emailAction: "update",
      confirmedDate: "2026-04-01",
    });
    assert.equal(action, "confirm");
  });

  it("keeps update when confirmed date existed", () => {
    const action = resolveEmailActionForSave(
      sampleLead({ appointment: { confirmedDate: "2026-03-01" } }),
      {
        emailAction: "update",
        confirmedDate: "2026-03-08",
      }
    );
    assert.equal(action, "update");
  });
});

describe("getPrimaryEmailActionLabel", () => {
  it("returns reject action for abgelehnt status", () => {
    const result = getPrimaryEmailActionLabel(sampleLead(), "abgelehnt", "", "");
    assert.equal(result?.action, "reject");
  });

  it("returns update when confirmed date changed", () => {
    const result = getPrimaryEmailActionLabel(
      sampleLead({ appointment: { confirmedDate: "2026-03-01" } }),
      "termin_bestaetigt",
      "2026-03-08",
      ""
    );
    assert.equal(result?.action, "update");
    assert.match(result?.label ?? "", /güncelle/i);
  });
});
