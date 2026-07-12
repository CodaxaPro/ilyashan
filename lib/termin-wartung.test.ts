import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { StoredLead } from "@/lib/leads-store";
import {
  buildTerminWartungContext,
  dateMatchesPreferredWeekday,
  filterDaysForWartung,
  isWartungQuote,
} from "./termin-wartung";
import { initialQuoteFormData } from "./quote-form";

function wartungLead(overrides: Partial<StoredLead> = {}): StoredLead {
  return {
    id: "lead-w",
    source: "quote",
    createdAt: "2026-01-01T10:00:00.000Z",
    name: "Wartung Kunde",
    summary: "x",
    photoCount: 0,
    quote: {
      ...initialQuoteFormData,
      windowCount: 12,
      services: ["privat", "wartung"],
      wartungPackageId: "quarterly",
      wartungPreferredWeekday: "di",
      wartungPreferredTimeSlot: "vormittag",
    },
    ...overrides,
  };
}

describe("termin wartung", () => {
  it("detects wartung quotes", () => {
    const quote = wartungLead().quote!;
    assert.equal(isWartungQuote({ ...initialQuoteFormData, ...quote }), true);
  });

  it("builds plan summary and preview dates", () => {
    const ctx = buildTerminWartungContext(wartungLead());
    assert.ok(ctx);
    assert.match(ctx!.planSummaryDe, /Vierteljährlich/);
    assert.match(ctx!.planSummaryDe, /Dienstag/);
    assert.ok(ctx!.previewDates.length > 0);
  });

  it("builds preview from confirmed anchor", () => {
    const ctx = buildTerminWartungContext(
      wartungLead({ appointment: { confirmedDate: "2026-03-10" } }),
      "2026-03-10"
    );
    assert.ok(ctx);
    assert.equal(ctx!.previewDateLabels.length, ctx!.previewDates.length);
  });

  it("filters availability to preferred weekday", () => {
    const days = [
      { date: "2026-03-10", available: true },
      { date: "2026-03-11", available: true },
    ];
    const filtered = filterDaysForWartung(days, "di");
    assert.equal(filtered[0].available, true);
    assert.equal(filtered[1].available, false);
  });

  it("matches weekday helper", () => {
    assert.equal(dateMatchesPreferredWeekday("2026-03-10", "di"), true);
    assert.equal(dateMatchesPreferredWeekday("2026-03-11", "di"), false);
  });
});
