import { DEFAULT_CLEANING_CONFIG } from "@/lib/cleaning/seed-config";
import { centsToEuros, formatEuroFromCents } from "@/lib/cleaning/money";
import type { StoredLead } from "@/lib/leads-store";
import type { StoredCleaningQuote } from "@/lib/cleaning/quotes-store";
import { isBueroLead } from "@/lib/lead-product";

export interface CleaningAdminOverview {
  configVersionId: string;
  lg1WageEuros: number;
  productiveLaborCostPerHourEuros: number;
  targetMarginPercent: number;
  minimumMarginPercent: number;
  minimumBillablePersonHours: number;
  minimumJobNetEuros: number;
  vatPercent: number;
  activeTaskRateVersion: string;
  calibrationRequiredTaskCount: number;
  activeTaskCount: number;
  quoteCount: number;
  manualReviewCount: number;
  manualReviewPercent: number;
}

export function buildCleaningAdminOverview(
  quotes: Array<Pick<StoredCleaningQuote, "quoteStatus"> | Pick<StoredLead, "cleaningSnapshot">>,
  config = DEFAULT_CLEANING_CONFIG
): CleaningAdminOverview {
  const quoteCount = quotes.length;
  const manualReviewCount = quotes.filter((q) => {
    if ("quoteStatus" in q) return q.quoteStatus === "MANUAL_REVIEW_REQUIRED";
    return q.cleaningSnapshot?.customer.quoteStatus === "MANUAL_REVIEW_REQUIRED";
  }).length;

  const calibrationRequiredTaskCount = config.tasks.filter(
    (t) => t.active && t.status === "CALIBRATION_REQUIRED"
  ).length;

  return {
    configVersionId: config.configVersionId,
    lg1WageEuros: config.lg1GrossHourlyEuros,
    productiveLaborCostPerHourEuros: centsToEuros(config.productiveHourCostCents),
    targetMarginPercent: Math.round(config.targetGrossMargin * 1000) / 10,
    minimumMarginPercent: Math.round(config.minimumGrossMargin * 1000) / 10,
    minimumBillablePersonHours: config.minimumBillablePersonHours,
    minimumJobNetEuros: centsToEuros(config.minimumJobNetCents),
    vatPercent: config.vatRateBps / 100,
    activeTaskRateVersion: config.tasks[0]?.version ?? "—",
    calibrationRequiredTaskCount,
    activeTaskCount: config.tasks.filter((t) => t.active).length,
    quoteCount,
    manualReviewCount,
    manualReviewPercent:
      quoteCount === 0 ? 0 : Math.round((manualReviewCount / quoteCount) * 1000) / 10,
  };
}

export function filterBueroLeads(leads: StoredLead[]): StoredLead[] {
  return leads.filter((l) => isBueroLead(l));
}

export function formatCleaningAdminMoney(cents: number): string {
  return formatEuroFromCents(cents);
}
