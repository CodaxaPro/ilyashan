/**
 * Independent reference implementation of the documented pricing formula.
 * Used only for audit tests – must stay aligned with lib/pricing-market-research.ts § FORMEL.
 */
import type { ElevatorOption, FloorLevel, QuoteFormData } from "@/lib/quote-form";
import { RECOMMENDED_PRICING as P } from "@/lib/pricing-market-research";

type PricingConstants = typeof P;

export interface ReferenceBreakdown {
  base: number;
  heightSurcharge: number;
  floorSurcharge: number;
  extrasTotal: number;
  addonsTotal: number;
  calculatedSubtotal: number;
  minimum: number;
  minimumApplied: boolean;
  subtotalAfterMinimum: number;
}

function heightMultiplier(height: number, pricing: PricingConstants = P as PricingConstants) {
  if (height > 4) return pricing.heightMultipliers.above4m;
  if (height > 3) return pricing.heightMultipliers.above3m;
  return pricing.heightMultipliers.default;
}

function floorAccessPercent(
  floorLevel: FloorLevel | "",
  elevator: ElevatorOption | "",
  pricing: PricingConstants = P as PricingConstants
) {
  if (!floorLevel || elevator === "ja" || floorLevel === "eg") return 0;
  const base = pricing.floorAccessPercent[floorLevel] ?? 0;
  const factor = elevator === "unbekannt" ? pricing.elevatorUnbekanntFactor : 1;
  return base * factor;
}

function getMinimum(data: QuoteFormData, pricing: PricingConstants) {
  if (data.services.includes("gewerbe") || data.objectType === "gewerbe") return pricing.minimumGewerbe;
  if (data.objectType === "haus") return pricing.minimumHaus;
  return pricing.minimumWohnung;
}

/** Reference formula – steps 1–6 from pricing-market-research (no Wartung monthly). */
export function referencePriceBreakdown(
  data: QuoteFormData,
  pricing: PricingConstants = P as PricingConstants
): ReferenceBreakdown {
  const sideMul = pricing.sideMultipliers[data.cleaningSide ?? "innen_aussen"];
  const dirtMul = pricing.dirtMultipliers[data.dirtLevel ?? "normal"];
  const heightMul = heightMultiplier(data.roomHeight ?? 2.5, pricing);
  const accessPct = floorAccessPercent(data.floorLevel, data.elevator, pricing);
  const n = data.windowCount;

  let base: number;
  if (data.services.includes("gewerbe")) {
    const glassSqm = n * pricing.avgSqmPerFluegel;
    base = glassSqm * pricing.gewerbePerSqm * sideMul * dirtMul;
  } else {
    base = n * pricing.basePerFluegel * sideMul * dirtMul;
  }

  const heightSurcharge = heightMul > 1 ? base * (heightMul - 1) : 0;
  const baseWithHeight = base * heightMul;
  const floorSurcharge = accessPct > 0 ? baseWithHeight * accessPct : 0;

  let extrasTotal = 0;
  const perFluegelKeys = [
    "withFrame",
    "withFalz",
    "windowSills",
    "muntinWindows",
    "oldBuildingWindows",
    "shutters",
    "blinds",
    "flyScreens",
  ] as const;

  for (const key of perFluegelKeys) {
    if (data[key]) extrasTotal += n * pricing.extrasPerFluegel[key];
  }
  if (data.skylights) extrasTotal += pricing.extrasFlat.skylights;
  if (data.canopy) {
    const sqm = data.canopySqm > 0 ? data.canopySqm : 5;
    extrasTotal += Math.max(pricing.extrasFlat.canopy, sqm * pricing.extrasFlat.canopyPerSqm);
  }
  if (data.narrowStairs) extrasTotal += pricing.extrasFlat.narrowStairs;

  let addonsTotal = 0;
  if (data.includeSolar && data.solarSqm > 0) {
    addonsTotal += Math.max(pricing.solarMin, data.solarSqm * pricing.solarPerSqm);
  }
  if (data.includeWintergarden && data.wintergardenSqm > 0) {
    addonsTotal += Math.max(pricing.wintergartenMin, data.wintergardenSqm * pricing.wintergartenPerSqm);
  }

  const calculatedSubtotal = base + heightSurcharge + floorSurcharge + extrasTotal + addonsTotal;
  const minimum = getMinimum(data, pricing);
  const minimumApplied = calculatedSubtotal < minimum;
  const subtotalAfterMinimum = minimumApplied ? minimum : calculatedSubtotal;

  return {
    base,
    heightSurcharge,
    floorSurcharge,
    extrasTotal,
    addonsTotal,
    calculatedSubtotal,
    minimum,
    minimumApplied,
    subtotalAfterMinimum,
  };
}
