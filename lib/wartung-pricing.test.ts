import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_WARTUNG_PACKAGES } from "./wartung-packages";
import {
  calculateWartungBreakdown,
  compareWartungPackages,
  resolveWartungPackageForQuote,
} from "./wartung-pricing";
import { initialQuoteFormData } from "./quote-form";

describe("wartung-pricing", () => {
  it("applies higher discount for more frequent packages", () => {
    const singleVisit = 100;
    const quarterly = calculateWartungBreakdown(
      singleVisit,
      DEFAULT_WARTUNG_PACKAGES.find((pkg) => pkg.id === "quarterly")!
    );
    const fourWeekly = calculateWartungBreakdown(
      singleVisit,
      DEFAULT_WARTUNG_PACKAGES.find((pkg) => pkg.id === "four_weekly")!
    );

    assert.ok(fourWeekly.discountPercent > quarterly.discountPercent);
    assert.ok(fourWeekly.yearlySavings > quarterly.yearlySavings);
    assert.ok(fourWeekly.monthlyPrice > quarterly.monthlyPrice);
  });

  it("enforces package minimum monthly", () => {
    const breakdown = calculateWartungBreakdown(
      40,
      DEFAULT_WARTUNG_PACKAGES.find((pkg) => pkg.id === "quarterly")!
    );
    assert.equal(breakdown.minimumMonthlyApplied, true);
    assert.ok(breakdown.monthlyPrice >= 59);
  });

  it("compares all privat packages", () => {
    const comparisons = compareWartungPackages(120, DEFAULT_WARTUNG_PACKAGES, "privat");
    assert.ok(comparisons.length >= 4);
    assert.ok(comparisons.every((item) => item.yearlySavings >= 0));
  });

  it("resolves selected package for quote", () => {
    const pkg = resolveWartungPackageForQuote(
      {
        ...initialQuoteFormData,
        services: ["privat", "wartung"],
        wartungPackageId: "four_weekly",
      },
      DEFAULT_WARTUNG_PACKAGES
    );
    assert.equal(pkg?.id, "four_weekly");
  });
});
