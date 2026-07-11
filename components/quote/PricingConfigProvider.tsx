"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_FENSTER_PRICING,
  toPricingOverrides,
  type FensterPricingConfig,
  type PricingOverrides,
  type ScheduleConfig,
} from "@/lib/pricing-config";

interface PricingConfigContextValue {
  config: FensterPricingConfig;
  pricingOverrides: PricingOverrides;
  schedule: ScheduleConfig;
  loaded: boolean;
}

const PricingConfigContext = createContext<PricingConfigContextValue>({
  config: DEFAULT_FENSTER_PRICING,
  pricingOverrides: toPricingOverrides(DEFAULT_FENSTER_PRICING),
  schedule: {
    scheduleMinLeadDays: DEFAULT_FENSTER_PRICING.scheduleMinLeadDays,
    scheduleWeekdaysOnly: DEFAULT_FENSTER_PRICING.scheduleWeekdaysOnly,
  },
  loaded: false,
});

export function PricingConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<FensterPricingConfig>(DEFAULT_FENSTER_PRICING);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/pricing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { config?: FensterPricingConfig } | null) => {
        if (cancelled || !data?.config) return;
        setConfig(data.config);
      })
      .catch(() => {
        /* defaults */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      config,
      pricingOverrides: toPricingOverrides(config),
      schedule: {
        scheduleMinLeadDays: config.scheduleMinLeadDays,
        scheduleWeekdaysOnly: config.scheduleWeekdaysOnly,
      },
      loaded,
    }),
    [config, loaded]
  );

  return (
    <PricingConfigContext.Provider value={value}>{children}</PricingConfigContext.Provider>
  );
}

export function usePricingConfig() {
  return useContext(PricingConfigContext);
}
