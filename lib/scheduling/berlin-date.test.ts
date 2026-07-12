import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addDaysToIsoDate, berlinIsoDate, berlinTomorrowIso } from "./berlin-date";

describe("berlin date", () => {
  it("adds days to iso date", () => {
    assert.equal(addDaysToIsoDate("2026-07-12", 1), "2026-07-13");
    assert.equal(addDaysToIsoDate("2026-12-31", 1), "2027-01-01");
  });

  it("formats berlin iso date deterministically with fixed instant", () => {
    const noonUtc = new Date("2026-07-12T10:00:00.000Z");
    assert.equal(berlinIsoDate(noonUtc), "2026-07-12");
    assert.equal(berlinTomorrowIso(noonUtc), "2026-07-13");
  });
});
