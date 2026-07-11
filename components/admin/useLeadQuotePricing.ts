"use client";

import { useEffect, useMemo, useState } from "react";
import type { StoredLead } from "@/lib/leads-store";
import {
  createQuotePricingContext,
  defaultQuotePricingContext,
  resolveLeadQuotePricing,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import { type FensterPricingConfig } from "@/lib/pricing-config";

export function useLeadQuotePricing(lead: Pick<StoredLead, "priceSnapshot">): QuotePricingContext {
  const [liveConfig, setLiveConfig] = useState<FensterPricingConfig | null>(null);

  useEffect(() => {
    if (lead.priceSnapshot) return;
    let cancelled = false;
    void fetch("/api/admin/pricing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { config?: FensterPricingConfig } | null) => {
        if (!cancelled && data?.config) setLiveConfig(data.config);
      })
      .catch(() => {
        /* defaults */
      });
    return () => {
      cancelled = true;
    };
  }, [lead.priceSnapshot]);

  return useMemo(() => {
    if (lead.priceSnapshot) return resolveLeadQuotePricing(lead);
    if (liveConfig) return createQuotePricingContext(liveConfig);
    return defaultQuotePricingContext();
  }, [lead, liveConfig]);
}
