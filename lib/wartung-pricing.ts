import type { WartungPackage, WartungPackageId } from "@/lib/wartung-packages";
import {
  DEFAULT_WARTUNG_PACKAGES,
  filterWartungPackagesForAudience,
  getWartungAudience,
  getWartungPackageById,
} from "@/lib/wartung-packages";
import type { QuoteFormData } from "@/lib/quote-form";

export interface WartungPriceBreakdown {
  packageId: WartungPackageId;
  packageLabel: string;
  singleVisitPrice: number;
  discountPercent: number;
  perVisitPrice: number;
  visitsPerYear: number;
  yearlyWithoutDiscount: number;
  yearlyTotal: number;
  yearlySavings: number;
  monthlyPrice: number;
  minimumMonthlyApplied: boolean;
  minMonthly: number;
}

function roundTo5(value: number) {
  return Math.round(value / 5) * 5;
}

export function calculateWartungBreakdown(
  singleVisitPrice: number,
  pkg: WartungPackage
): WartungPriceBreakdown {
  const discountPercent = pkg.discountPercent;
  const perVisitPrice = singleVisitPrice * (1 - discountPercent);
  const yearlyWithoutDiscount = singleVisitPrice * pkg.visitsPerYear;
  const yearlyTotal = perVisitPrice * pkg.visitsPerYear;
  const rawMonthly = yearlyTotal / 12;
  const minimumMonthlyApplied = rawMonthly < pkg.minMonthly;
  const monthlyPrice = roundTo5(Math.max(pkg.minMonthly, rawMonthly));
  const yearlySavings = yearlyWithoutDiscount - yearlyTotal;

  return {
    packageId: pkg.id,
    packageLabel: pkg.labelDe,
    singleVisitPrice,
    discountPercent,
    perVisitPrice,
    visitsPerYear: pkg.visitsPerYear,
    yearlyWithoutDiscount,
    yearlyTotal,
    yearlySavings,
    monthlyPrice,
    minimumMonthlyApplied,
    minMonthly: pkg.minMonthly,
  };
}

export function compareWartungPackages(
  singleVisitPrice: number,
  packages: WartungPackage[],
  audience: "privat" | "gewerbe"
): WartungPriceBreakdown[] {
  return filterWartungPackagesForAudience(packages, audience).map((pkg) =>
    calculateWartungBreakdown(singleVisitPrice, pkg)
  );
}

export function resolveWartungPackageForQuote(
  data: Pick<QuoteFormData, "services" | "wartungPackageId">,
  packages: WartungPackage[] = DEFAULT_WARTUNG_PACKAGES
): WartungPackage | null {
  const audience = getWartungAudience(data.services);
  const selected = getWartungPackageById(packages, data.wartungPackageId);
  if (selected) {
    const allowed =
      audience === "gewerbe" ? selected.visibleGewerbe : selected.visiblePrivat;
    if (allowed) return selected;
  }
  const available = filterWartungPackagesForAudience(packages, audience);
  return available[0] ?? null;
}

export function getWartungSavingsVsPackage(
  current: WartungPriceBreakdown,
  other: WartungPriceBreakdown
): number {
  return other.yearlySavings - current.yearlySavings;
}

export function getWartungMonthlyDelta(
  current: WartungPriceBreakdown,
  other: WartungPriceBreakdown
): number {
  return other.monthlyPrice - current.monthlyPrice;
}
