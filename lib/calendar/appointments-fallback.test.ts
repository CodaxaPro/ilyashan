import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listAppointmentsFromLeadsFallback } from "./appointments-db";
import type { StoredLead } from "../leads-store";
import { initialQuoteFormData } from "../quote-form";

function quoteLead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "quote-1",
    source: "quote",
    createdAt: "2026-01-10T10:00:00.000Z",
    name: "Anna Schmidt",
    email: "anna@example.com",
    summary: "Test",
    photoCount: 0,
    status: "neu",
    quote: {
      ...initialQuoteFormData,
      services: ["privat"],
      windowCount: 12,
      postalCode: "52499",
      city: "Baesweiler",
      preferredDates: ["2026-03-10", "2026-03-12", "2026-03-15", "2026-03-20"],
    },
    ...overrides,
  };
}

describe("listAppointmentsFromLeadsFallback", () => {
  it("filters by inclusive date range", () => {
    const items = listAppointmentsFromLeadsFallback([quoteLead()], "2026-03-09", "2026-03-14");
    assert.equal(items.length, 2);
    assert.ok(items.every((i) => i.eventDate >= "2026-03-09" && i.eventDate <= "2026-03-14"));
  });

  it("assigns stable local ids", () => {
    const items = listAppointmentsFromLeadsFallback([quoteLead()], "2026-03-01", "2026-03-31");
    assert.ok(items.every((i) => i.id.startsWith("local-quote-1-")));
  });

  it("excludes rejected leads", () => {
    const items = listAppointmentsFromLeadsFallback(
      [quoteLead({ status: "abgelehnt" })],
      "2026-03-01",
      "2026-03-31"
    );
    assert.equal(items.length, 0);
  });

  it("merges multiple leads", () => {
    const items = listAppointmentsFromLeadsFallback(
      [
        quoteLead({ id: "a", quote: { ...quoteLead().quote!, preferredDates: ["2026-03-10"] } }),
        quoteLead({ id: "b", quote: { ...quoteLead().quote!, preferredDates: ["2026-03-11"] } }),
      ],
      "2026-03-01",
      "2026-03-31"
    );
    assert.equal(items.length, 2);
    assert.notEqual(items[0].leadId, items[1].leadId);
  });
});
