"use client";

import type { QuoteFormData } from "@/lib/quote-form";
import { calculatePriceEstimate } from "@/lib/pricing";
import { usePricingConfig } from "@/components/quote/PricingConfigProvider";
import type { PriceEstimate } from "@/lib/pricing";

export function useQuotePriceEstimate(data: QuoteFormData): PriceEstimate | null {
  const { pricingOverrides, wartungConfig } = usePricingConfig();
  return calculatePriceEstimate(data, pricingOverrides, wartungConfig);
}
