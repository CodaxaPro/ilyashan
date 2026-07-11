import { RECOMMENDED_PRICING } from "@/lib/pricing-market-research";

/** Admin-editable Fensterreinigung pricing (Faz 0). */
export interface FensterPricingConfig {
  basePerFluegel: number;
  minimumWohnung: number;
  minimumHaus: number;
  minimumGewerbe: number;
  wartungDiscount: number;
  wartungVisitsPerYear: number;
  wartungMinMonthly: number;
  scheduleMinLeadDays: number;
  scheduleWeekdaysOnly: boolean;
  updatedAt?: string;
}

export type PricingOverrides = Pick<
  FensterPricingConfig,
  | "basePerFluegel"
  | "minimumWohnung"
  | "minimumHaus"
  | "minimumGewerbe"
  | "wartungDiscount"
  | "wartungVisitsPerYear"
  | "wartungMinMonthly"
>;

export type ScheduleConfig = Pick<
  FensterPricingConfig,
  "scheduleMinLeadDays" | "scheduleWeekdaysOnly"
>;

const SETTINGS_KEY = "ilyashan:settings:fenster-pricing";

export const DEFAULT_FENSTER_PRICING: FensterPricingConfig = {
  basePerFluegel: RECOMMENDED_PRICING.basePerFluegel,
  minimumWohnung: RECOMMENDED_PRICING.minimumWohnung,
  minimumHaus: RECOMMENDED_PRICING.minimumHaus,
  minimumGewerbe: RECOMMENDED_PRICING.minimumGewerbe,
  wartungDiscount: RECOMMENDED_PRICING.wartungDiscount,
  wartungVisitsPerYear: RECOMMENDED_PRICING.wartungVisitsPerYear,
  wartungMinMonthly: RECOMMENDED_PRICING.wartungMinMonthly,
  scheduleMinLeadDays: 2,
  scheduleWeekdaysOnly: false,
};

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function isPricingConfigStoreConfigured(): boolean {
  return isKvConfigured();
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function sanitizeFensterPricingConfig(
  raw: Partial<FensterPricingConfig> | null | undefined
): FensterPricingConfig {
  const d = DEFAULT_FENSTER_PRICING;
  return {
    basePerFluegel: clampNumber(raw?.basePerFluegel, 2, 25, d.basePerFluegel),
    minimumWohnung: clampNumber(raw?.minimumWohnung, 20, 200, d.minimumWohnung),
    minimumHaus: clampNumber(raw?.minimumHaus, 30, 300, d.minimumHaus),
    minimumGewerbe: clampNumber(raw?.minimumGewerbe, 50, 500, d.minimumGewerbe),
    wartungDiscount: clampNumber(raw?.wartungDiscount, 0, 0.5, d.wartungDiscount),
    wartungVisitsPerYear: clampNumber(raw?.wartungVisitsPerYear, 1, 52, d.wartungVisitsPerYear),
    wartungMinMonthly: clampNumber(raw?.wartungMinMonthly, 20, 300, d.wartungMinMonthly),
    scheduleMinLeadDays: clampNumber(raw?.scheduleMinLeadDays, 0, 14, d.scheduleMinLeadDays),
    scheduleWeekdaysOnly: raw?.scheduleWeekdaysOnly === true,
    updatedAt: raw?.updatedAt,
  };
}

export function toPricingOverrides(config: FensterPricingConfig): PricingOverrides {
  return {
    basePerFluegel: config.basePerFluegel,
    minimumWohnung: config.minimumWohnung,
    minimumHaus: config.minimumHaus,
    minimumGewerbe: config.minimumGewerbe,
    wartungDiscount: config.wartungDiscount,
    wartungVisitsPerYear: config.wartungVisitsPerYear,
    wartungMinMonthly: config.wartungMinMonthly,
  };
}

export async function getFensterPricingConfig(): Promise<FensterPricingConfig> {
  if (!isKvConfigured()) return { ...DEFAULT_FENSTER_PRICING };

  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<Partial<FensterPricingConfig>>(SETTINGS_KEY);
    return sanitizeFensterPricingConfig(stored ?? undefined);
  } catch (error) {
    console.error("[pricing-config] get failed:", error);
    return { ...DEFAULT_FENSTER_PRICING };
  }
}

export async function setFensterPricingConfig(
  patch: Partial<FensterPricingConfig>
): Promise<FensterPricingConfig> {
  const current = await getFensterPricingConfig();
  const next = sanitizeFensterPricingConfig({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  if (!isKvConfigured()) return next;

  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(SETTINGS_KEY, next);
    return next;
  } catch (error) {
    console.error("[pricing-config] set failed:", error);
    throw error;
  }
}
