import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCleaningAdminOverview,
  filterBueroLeads,
} from "./admin-overview";
import { DEFAULT_CLEANING_CONFIG } from "./seed-config";
import type { StoredLead } from "@/lib/leads-store";

describe("cleaning/admin-overview", () => {
  it("computes overview from empty quotes", () => {
    const o = buildCleaningAdminOverview([], DEFAULT_CLEANING_CONFIG);
    assert.equal(o.quoteCount, 0);
    assert.equal(o.lg1WageEuros, 15);
    assert.equal(o.vatPercent, 19);
    assert.ok(o.calibrationRequiredTaskCount > 0);
  });

  it("counts manual review percent", () => {
    const o = buildCleaningAdminOverview(
      [
        { quoteStatus: "INDICATION" },
        { quoteStatus: "MANUAL_REVIEW_REQUIRED" },
      ],
      DEFAULT_CLEANING_CONFIG
    );
    assert.equal(o.quoteCount, 2);
    assert.equal(o.manualReviewCount, 1);
    assert.equal(o.manualReviewPercent, 50);
  });

  it("filters buero leads only", () => {
    const leads = [
      { id: "1", serviceLine: "fenster", source: "quote" },
      { id: "2", serviceLine: "buero", cleaningSnapshot: { input: { totalAreaM2: 10 } } },
    ] as unknown as StoredLead[];
    assert.equal(filterBueroLeads(leads).length, 1);
  });
});
