import { RECOMMENDED_PRICING } from "@/lib/pricing-market-research";
import {
  DEFAULT_WARTUNG_PACKAGES,
  sanitizeWartungPackages,
  type WartungPackage,
} from "@/lib/wartung-packages";

/** Admin-editable Fensterreinigung pricing (Faz 0 + Wartung v2). */
export interface FensterPricingConfig {
  basePerFluegel: number;
  minimumWohnung: number;
  minimumHaus: number;
  minimumGewerbe: number;
  /** @deprecated Legacy fallback – quarterly package is source of truth */
  wartungDiscount: number;
  /** @deprecated Legacy fallback */
  wartungVisitsPerYear: number;
  /** @deprecated Legacy fallback */
  wartungMinMonthly: number;
  wartungPackages: WartungPackage[];
  wartungFirstVisitSurchargePercent: number;
  wartungMinContractMonths: number;
  scheduleMinLeadDays: number;
  scheduleWeekdaysOnly: boolean;
  updatedAt?: string;
}

export type PricingOverrides = Pick<
  FensterPricingConfig,
  "basePerFluegel" | "minimumWohnung" | "minimumHaus" | "minimumGewerbe"
>;

export type WartungPricingConfig = Pick<
  FensterPricingConfig,
  "wartungPackages" | "wartungFirstVisitSurchargePercent"
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
  wartungPackages: DEFAULT_WARTUNG_PACKAGES.map((pkg) => ({ ...pkg })),
  wartungFirstVisitSurchargePercent: 0,
  wartungMinContractMonths: 12,
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

/** Launch-Preise (5 € / 49 / 69) → Nov 2026, wenn KV noch Altwerte speichert */
function migrateLegacyLaunchPrices(
  raw: Partial<FensterPricingConfig> | null | undefined
): Partial<FensterPricingConfig> | null | undefined {
  if (!raw) return raw;
  const legacyBase = raw.basePerFluegel === 5 || raw.basePerFluegel === 5.0;
  const legacyWohnung = raw.minimumWohnung === 49;
  const legacyHaus = raw.minimumHaus === 69;
  if (!legacyBase && !legacyWohnung && !legacyHaus) return raw;
  return {
    ...raw,
    ...(legacyBase ? { basePerFluegel: DEFAULT_FENSTER_PRICING.basePerFluegel } : {}),
    ...(legacyWohnung ? { minimumWohnung: DEFAULT_FENSTER_PRICING.minimumWohnung } : {}),
    ...(legacyHaus ? { minimumHaus: DEFAULT_FENSTER_PRICING.minimumHaus } : {}),
  };
}

export function sanitizeFensterPricingConfig(
  raw: Partial<FensterPricingConfig> | null | undefined
): FensterPricingConfig {
  const d = DEFAULT_FENSTER_PRICING;
  const input = migrateLegacyLaunchPrices(raw);
  const packages = sanitizeWartungPackages(input?.wartungPackages);

  // Migrate legacy single-tier config into quarterly package when packages missing in KV
  if (input?.wartungPackages === undefined && input?.wartungDiscount !== undefined) {
    const quarterly = packages.find((pkg) => pkg.id === "quarterly");
    if (quarterly) {
      quarterly.discountPercent = clampNumber(input.wartungDiscount, 0, 0.5, quarterly.discountPercent);
      quarterly.visitsPerYear = clampNumber(
        input.wartungVisitsPerYear,
        1,
        52,
        quarterly.visitsPerYear
      );
      quarterly.minMonthly = clampNumber(input.wartungMinMonthly, 20, 500, quarterly.minMonthly);
    }
  }

  return {
    basePerFluegel: clampNumber(input?.basePerFluegel, 2, 25, d.basePerFluegel),
    minimumWohnung: clampNumber(input?.minimumWohnung, 20, 200, d.minimumWohnung),
    minimumHaus: clampNumber(input?.minimumHaus, 30, 300, d.minimumHaus),
    minimumGewerbe: clampNumber(input?.minimumGewerbe, 50, 500, d.minimumGewerbe),
    wartungDiscount: clampNumber(input?.wartungDiscount, 0, 0.5, d.wartungDiscount),
    wartungVisitsPerYear: clampNumber(input?.wartungVisitsPerYear, 1, 52, d.wartungVisitsPerYear),
    wartungMinMonthly: clampNumber(input?.wartungMinMonthly, 20, 300, d.wartungMinMonthly),
    wartungPackages: packages,
    wartungFirstVisitSurchargePercent: clampNumber(
      input?.wartungFirstVisitSurchargePercent,
      0,
      1,
      d.wartungFirstVisitSurchargePercent
    ),
    wartungMinContractMonths: clampNumber(input?.wartungMinContractMonths, 1, 36, d.wartungMinContractMonths),
    scheduleMinLeadDays: clampNumber(input?.scheduleMinLeadDays, 0, 14, d.scheduleMinLeadDays),
    scheduleWeekdaysOnly: input?.scheduleWeekdaysOnly === true,
    updatedAt: input?.updatedAt,
  };
}

export function toPricingOverrides(config: FensterPricingConfig): PricingOverrides {
  return {
    basePerFluegel: config.basePerFluegel,
    minimumWohnung: config.minimumWohnung,
    minimumHaus: config.minimumHaus,
    minimumGewerbe: config.minimumGewerbe,
  };
}

export function toWartungPricingConfig(config: FensterPricingConfig): WartungPricingConfig {
  return {
    wartungPackages: config.wartungPackages,
    wartungFirstVisitSurchargePercent: config.wartungFirstVisitSurchargePercent,
  };
}

export async function getFensterPricingConfig(): Promise<FensterPricingConfig> {
  if (!isKvConfigured()) return sanitizeFensterPricingConfig(undefined);

  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<Partial<FensterPricingConfig>>(SETTINGS_KEY);
    return sanitizeFensterPricingConfig(stored ?? undefined);
  } catch (error) {
    console.error("[pricing-config] get failed:", error);
    return sanitizeFensterPricingConfig(undefined);
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
