import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveCalendarQueryRange, resolveUpcomingFetchRange } from "./query-range";

describe("query-range", () => {
  it("resolves week view", () => {
    const range = resolveCalendarQueryRange(new URLSearchParams("view=week&weekStart=2026-03-09"));
    assert.equal(range.view, "week");
    assert.equal(range.from, "2026-03-09");
    assert.ok(range.week);
  });

  it("resolves month view", () => {
    const range = resolveCalendarQueryRange(new URLSearchParams("view=month&month=2026-03"));
    assert.equal(range.view, "month");
    assert.equal(range.month?.month, 3);
    assert.ok(range.days.length > 20);
  });

  it("resolves agenda view", () => {
    const range = resolveCalendarQueryRange(
      new URLSearchParams("view=agenda&from=2026-03-01&to=2026-03-31")
    );
    assert.equal(range.view, "agenda");
    assert.equal(range.from, "2026-03-01");
    assert.equal(range.to, "2026-03-31");
  });

  it("upcoming fetch spans overdue and near future", () => {
    const { from, to } = resolveUpcomingFetchRange("2026-03-10");
    assert.equal(from, "2026-02-08");
    assert.equal(to, "2026-03-24");
  });
});
