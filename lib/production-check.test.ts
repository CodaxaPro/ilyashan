import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runProductionChecks, productionReadinessScore } from "./production-check";

describe("production-check", () => {
  it("returns structured checks", () => {
    const checks = runProductionChecks();
    assert.ok(checks.length >= 5);
    assert.ok(checks.every((c) => c.id && c.label && c.detail));
  });

  it("scores between 0 and 100", () => {
    const score = productionReadinessScore();
    assert.ok(score >= 0 && score <= 100);
  });
});
