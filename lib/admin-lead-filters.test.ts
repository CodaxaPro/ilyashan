import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countActiveLeadFilters,
  EMPTY_LEAD_LIST_FILTERS,
  filterLeads,
  leadMatchesQuery,
} from "./admin-lead-filters";
import type { StoredLead } from "./leads-store";

function lead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-1",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Anna Schmidt",
    email: "anna@test.de",
    phone: "0241 123456",
    anfrageNr: "ANG-2026-111",
    summary: "12 Flügel Baesweiler",
    photoCount: 0,
    status: "neu",
    quote: { postalCode: "52499", city: "Baesweiler", firstName: "Anna", lastName: "Schmidt" },
    ...overrides,
  };
}

describe("admin-lead-filters", () => {
  it("matches name, anfrage, city, email", () => {
    const sample = lead();
    assert.equal(leadMatchesQuery(sample, "anna"), true);
    assert.equal(leadMatchesQuery(sample, "ANG-2026"), true);
    assert.equal(leadMatchesQuery(sample, "baesweiler"), true);
    assert.equal(leadMatchesQuery(sample, "anna@test.de"), true);
    assert.equal(leadMatchesQuery(sample, "xyz-not-found"), false);
  });

  it("matches phone by digits ignoring spaces", () => {
    assert.equal(leadMatchesQuery(lead(), "0241123"), true);
    assert.equal(leadMatchesQuery(lead(), "241 123"), true);
  });

  it("filters by status and source without dropping unrelated fields", () => {
    const leads = [
      lead({ id: "a", status: "neu", source: "quote" }),
      lead({ id: "b", status: "kontaktiert", source: "contact", name: "Bernd" }),
      lead({ id: "c", status: "termin_bestaetigt", source: "concierge", name: "Cara" }),
    ];
    assert.equal(
      filterLeads(leads, { ...EMPTY_LEAD_LIST_FILTERS, status: "kontaktiert" }).map((l) => l.id).join(),
      "b"
    );
    assert.equal(
      filterLeads(leads, { ...EMPTY_LEAD_LIST_FILTERS, source: "quote" }).map((l) => l.id).join(),
      "a"
    );
    assert.equal(
      filterLeads(leads, { query: "cara", status: "all", source: "all" }).map((l) => l.id).join(),
      "c"
    );
  });

  it("empty filters return all non-archived leads", () => {
    const leads = [lead({ id: "1" }), lead({ id: "2", name: "Other" })];
    assert.equal(filterLeads(leads, EMPTY_LEAD_LIST_FILTERS).length, 2);
    assert.equal(countActiveLeadFilters(EMPTY_LEAD_LIST_FILTERS), 0);
    assert.equal(
      countActiveLeadFilters({ query: "x", status: "neu", source: "quote", includeArchived: true }),
      4
    );
  });

  it("hides archived leads unless includeArchived", () => {
    const leads = [
      lead({ id: "live" }),
      lead({ id: "old", archivedAt: "2026-01-02T00:00:00.000Z", name: "Archived" }),
    ];
    assert.equal(filterLeads(leads, EMPTY_LEAD_LIST_FILTERS).map((l) => l.id).join(), "live");
    assert.equal(
      filterLeads(leads, { ...EMPTY_LEAD_LIST_FILTERS, includeArchived: true }).length,
      2
    );
  });
});
