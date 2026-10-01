import { addCents, cents, percentOfCents, type EuroCents } from "./money";
import type { CleaningEngineConfig } from "./seed-config";
import type { CleaningFrequency, QuoteStatus, RoundingMode } from "./types";

export interface PriceBreakdown {
  totalCostCents: EuroCents;
  targetMargin: number;
  baseSellingNetCents: EuroCents;
  commercialDiscountRate: number;
  afterDiscountNetCents: EuroCents;
  minimumJobNetCents: EuroCents;
  rawNetCents: EuroCents;
  roundedNetCents: EuroCents;
  vatCents: EuroCents;
  grossCents: EuroCents;
  realizedMargin: number;
  belowMinimumMargin: boolean;
  quoteStatus: QuoteStatus;
}

export function applyRounding(raw: EuroCents | number, mode: RoundingMode): EuroCents {
  const euros = raw / 100;
  let rounded: number;
  switch (mode) {
    case "NONE":
      return cents(raw);
    case "0.50":
      rounded = Math.ceil(euros * 2) / 2;
      break;
    case "1.00":
      rounded = Math.ceil(euros);
      break;
    case "5.00":
      rounded = Math.ceil(euros / 5) * 5;
      break;
    case "COMMERCIAL_90":
      // nearest *.90 below or equal after ceil to euro then -0.10
      rounded = Math.ceil(euros) - 0.1;
      if (rounded < euros) rounded = Math.ceil(euros) + 0.9;
      break;
    default:
      rounded = euros;
  }
  return cents(Math.round(rounded * 100));
}

/**
 * Margin on price: sell = cost / (1 - margin). NOT cost × (1+margin).
 */
export function sellingNetFromCost(totalCostCents: number, targetMargin: number): EuroCents {
  if (targetMargin >= 1 || targetMargin < 0) {
    throw new RangeError("targetMargin must be in [0, 1)");
  }
  const denom = 1 - targetMargin;
  return cents(Math.round(totalCostCents / denom));
}

export function calculatePrice(
  totalCostCents: EuroCents | number,
  frequency: CleaningFrequency,
  config: CleaningEngineConfig,
  options?: { forceManualReview?: boolean; overrideStatus?: QuoteStatus }
): PriceBreakdown {
  const targetMargin = config.targetGrossMargin;
  const baseSellingNetCents = sellingNetFromCost(totalCostCents, targetMargin);
  const commercialDiscountRate = config.frequencyCommercialDiscounts[frequency] ?? 0;
  const afterDiscountNetCents = cents(
    Math.round(baseSellingNetCents * (1 - commercialDiscountRate))
  );

  const rawNetCents = cents(
    Math.max(afterDiscountNetCents, config.minimumJobNetCents)
  );
  const roundedNetCents = applyRounding(rawNetCents, config.rounding);
  const vatCents = percentOfCents(roundedNetCents, config.vatRateBps);
  const grossCents = addCents(roundedNetCents, vatCents);

  const realizedMargin =
    roundedNetCents > 0 ? 1 - totalCostCents / roundedNetCents : 0;
  const belowMinimumMargin = realizedMargin + 1e-9 < config.minimumGrossMargin;

  const quoteStatus: QuoteStatus =
    options?.overrideStatus ??
    (options?.forceManualReview || belowMinimumMargin
      ? "MANUAL_REVIEW_REQUIRED"
      : "INDICATION");

  return {
    totalCostCents: cents(totalCostCents),
    targetMargin,
    baseSellingNetCents,
    commercialDiscountRate,
    afterDiscountNetCents,
    minimumJobNetCents: config.minimumJobNetCents,
    rawNetCents,
    roundedNetCents,
    vatCents,
    grossCents,
    realizedMargin,
    belowMinimumMargin,
    quoteStatus,
  };
}
