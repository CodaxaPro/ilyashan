import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_WARTUNG_PACKAGES,
  filterWartungPackagesForAudience,
  getDefaultWartungPackageId,
  sanitizeWartungPackages,
} from "./wartung-packages";

describe("wartung-packages", () => {
  it("sanitizes all default package ids", () => {
    const packages = sanitizeWartungPackages(undefined);
    assert.equal(packages.length, DEFAULT_WARTUNG_PACKAGES.length);
    assert.ok(packages.some((pkg) => pkg.id === "quarterly"));
  });

  it("filters privat packages without weekly by default", () => {
    const packages = filterWartungPackagesForAudience(DEFAULT_WARTUNG_PACKAGES, "privat");
    assert.equal(packages.some((pkg) => pkg.id === "weekly"), false);
    assert.equal(packages.some((pkg) => pkg.id === "four_weekly"), true);
  });

  it("filters gewerbe packages including weekly", () => {
    const packages = filterWartungPackagesForAudience(DEFAULT_WARTUNG_PACKAGES, "gewerbe");
    assert.equal(packages.some((pkg) => pkg.id === "weekly"), true);
  });

  it("defaults to popular package for privat", () => {
    const id = getDefaultWartungPackageId(DEFAULT_WARTUNG_PACKAGES, "privat");
    assert.equal(id, "four_weekly");
  });

  it("clamps invalid discount in package patch", () => {
    const packages = sanitizeWartungPackages([
      { id: "quarterly", discountPercent: 9, visitsPerYear: 4, minMonthly: 59 },
    ]);
    const quarterly = packages.find((pkg) => pkg.id === "quarterly");
    assert.ok(quarterly);
    assert.equal(quarterly!.discountPercent, 0.5);
  });
});
