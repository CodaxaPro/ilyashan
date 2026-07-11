import type { QuoteFormData } from "@/lib/quote-form";
import {
  DEFAULT_FENSTER_PRICING,
  getFensterPricingConfig,
  toPricingOverrides,
  toWartungPricingConfig,
  type FensterPricingConfig,
  type PricingOverrides,
  type WartungPricingConfig,
} from "@/lib/pricing-config";
import type { WartungPackage } from "@/lib/wartung-packages";
import { calculatePriceEstimate, formatEuro, type PriceEstimate } from "@/lib/pricing";
import type { StoredLead } from "@/lib/leads-store";

/** Shared pricing inputs for every quote output channel (wizard, email, PDF, admin). */
export interface QuotePricingContext {
  pricingOverrides: PricingOverrides;
  wartungConfig: WartungPricingConfig;
  wartungPackages: WartungPackage[];
}

/** Immutable price captured at submission time – same numbers everywhere afterward. */
export interface QuotePriceSnapshot {
  priceLabel: string;
  amount: number;
  min: number;
  max: number;
  calculatedSubtotal: number;
  minimumApplied: boolean;
  minimumAmount: number;
  configUpdatedAt?: string;
  capturedAt: string;
  pricing: PricingOverrides;
  wartungConfig: WartungPricingConfig;
  wartungPackages: WartungPackage[];
}

export function createQuotePricingContext(config: FensterPricingConfig): QuotePricingContext {
  return {
    pricingOverrides: toPricingOverrides(config),
    wartungConfig: toWartungPricingConfig(config),
    wartungPackages: config.wartungPackages,
  };
}

export function defaultQuotePricingContext(): QuotePricingContext {
  return createQuotePricingContext(DEFAULT_FENSTER_PRICING);
}

export function contextFromSnapshot(snapshot: QuotePriceSnapshot): QuotePricingContext {
  return {
    pricingOverrides: snapshot.pricing,
    wartungConfig: snapshot.wartungConfig,
    wartungPackages: snapshot.wartungPackages,
  };
}

function formatPriceLabel(estimate: PriceEstimate): string {
  if (estimate.amount > 0) {
    return `ca. ${formatEuro(estimate.min)} – ${formatEuro(estimate.max)}`;
  }
  return `${formatEuro(estimate.min)} – ${formatEuro(estimate.max)} (${estimate.label})`;
}

export function captureQuotePriceSnapshot(
  data: QuoteFormData,
  ctx: QuotePricingContext,
  configUpdatedAt?: string
): QuotePriceSnapshot | null {
  const estimate = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig);
  if (!estimate) return null;

  return {
    priceLabel: formatPriceLabel(estimate),
    amount: estimate.amount,
    min: estimate.min,
    max: estimate.max,
    calculatedSubtotal: estimate.calculatedSubtotal,
    minimumApplied: estimate.minimumApplied,
    minimumAmount: estimate.minimumAmount,
    configUpdatedAt,
    capturedAt: new Date().toISOString(),
    pricing: { ...ctx.pricingOverrides },
    wartungConfig: {
      wartungPackages: ctx.wartungConfig.wartungPackages.map((pkg) => ({ ...pkg })),
      wartungFirstVisitSurchargePercent: ctx.wartungConfig.wartungFirstVisitSurchargePercent,
    },
    wartungPackages: ctx.wartungPackages.map((pkg) => ({ ...pkg })),
  };
}

export function resolveLeadQuotePricing(
  lead: Pick<StoredLead, "priceSnapshot">,
  fallback: QuotePricingContext = defaultQuotePricingContext()
): QuotePricingContext {
  if (lead.priceSnapshot) return contextFromSnapshot(lead.priceSnapshot);
  return fallback;
}

export async function resolveServerQuotePricing(
  lead?: Pick<StoredLead, "priceSnapshot">
): Promise<QuotePricingContext> {
  if (lead?.priceSnapshot) return contextFromSnapshot(lead.priceSnapshot);
  const config = await getFensterPricingConfig();
  return createQuotePricingContext(config);
}

/** Subtotal used for Wartung contract math (after minimum, before display rounding). */
export function getBillingSubtotal(estimate: PriceEstimate): number {
  return estimate.minimumApplied ? estimate.minimumAmount : estimate.calculatedSubtotal;
}
