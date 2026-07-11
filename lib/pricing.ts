import type {
  ElevatorOption,
  FloorLevel,
  QuoteFormData,
} from "@/lib/quote-form";
import { siteConfig } from "@/lib/config";
import { RECOMMENDED_PRICING } from "@/lib/pricing-market-research";
import type { PricingOverrides, WartungPricingConfig } from "@/lib/pricing-config";
import {
  calculateWartungBreakdown,
  compareWartungPackages,
  resolveWartungPackageForQuote,
  type WartungPriceBreakdown,
} from "@/lib/wartung-pricing";
import { getWartungAudience } from "@/lib/wartung-packages";

export type PricingConstants = {
  -readonly [K in keyof typeof RECOMMENDED_PRICING]: typeof RECOMMENDED_PRICING[K] extends number
    ? number
    : typeof RECOMMENDED_PRICING[K];
};

export interface PriceLineItem {
  label: string;
  amount: number;
  detail?: string;
}

export interface PriceEstimate {
  amount: number;
  min: number;
  max: number;
  label: string;
  note: string;
  isIndicative: true;
  breakdown: PriceLineItem[];
  calculatedSubtotal: number;
  minimumApplied: boolean;
  minimumAmount: number;
  wartung?: WartungPriceBreakdown;
  wartungComparisons?: WartungPriceBreakdown[];
}

function mergePricing(overrides?: PricingOverrides): PricingConstants {
  if (!overrides) return RECOMMENDED_PRICING as PricingConstants;
  return { ...RECOMMENDED_PRICING, ...overrides } as PricingConstants;
}

function roundTo5(value: number) {
  return Math.round(value / 5) * 5;
}

function getMinimum(data: QuoteFormData, P: PricingConstants) {
  if (data.services.includes("gewerbe") || data.objectType === "gewerbe") {
    return P.minimumGewerbe;
  }
  if (data.objectType === "haus") return P.minimumHaus;
  return P.minimumWohnung;
}

function getHeightMultiplier(height: number, P: PricingConstants) {
  if (height > 4) return P.heightMultipliers.above4m;
  if (height > 3) return P.heightMultipliers.above3m;
  return P.heightMultipliers.default;
}

function getAccessPercent(
  floorLevel: FloorLevel | "",
  elevator: ElevatorOption | "",
  P: PricingConstants
) {
  if (!floorLevel || elevator === "ja" || floorLevel === "eg") return 0;
  const base = P.floorAccessPercent[floorLevel] ?? 0;
  const factor = elevator === "unbekannt" ? P.elevatorUnbekanntFactor : 1;
  return base * factor;
}

function isGewerbePricing(data: QuoteFormData) {
  return data.services.includes("gewerbe");
}

function isWartungJob(data: QuoteFormData) {
  return data.services.includes("wartung");
}

function calculateExtras(data: QuoteFormData, P: PricingConstants): { total: number; items: PriceLineItem[] } {
  const items: PriceLineItem[] = [];
  const n = data.windowCount;

  const perFluegelMap: [keyof QuoteFormData, keyof typeof P.extrasPerFluegel, string][] = [
    ["withFrame", "withFrame", "Rahmenreinigung"],
    ["withFalz", "withFalz", "Fugen & Falz"],
    ["windowSills", "windowSills", "Fensterbänke"],
    ["muntinWindows", "muntinWindows", "Sprossenfenster"],
    ["oldBuildingWindows", "oldBuildingWindows", "Altbaufenster"],
    ["shutters", "shutters", "Rollläden"],
    ["blinds", "blinds", "Jalousien"],
    ["flyScreens", "flyScreens", "Fliegengitter"],
  ];

  for (const [key, priceKey, label] of perFluegelMap) {
    if (data[key]) {
      const unit = P.extrasPerFluegel[priceKey];
      items.push({ label, amount: n * unit, detail: `${n} × ${unit.toFixed(2)} €` });
    }
  }

  if (data.skylights) {
    items.push({
      label: "Dachfenster / Oberlichter",
      amount: P.extrasFlat.skylights,
      detail: "1× pauschal",
    });
  }

  if (data.canopy) {
    const sqm = data.canopySqm > 0 ? data.canopySqm : 5;
    const amount = Math.max(P.extrasFlat.canopy, sqm * P.extrasFlat.canopyPerSqm);
    items.push({
      label: "Vordach / Glasdach",
      amount,
      detail: `${sqm} m² × ${P.extrasFlat.canopyPerSqm.toFixed(2)} €`,
    });
  }

  if (data.narrowStairs) {
    items.push({
      label: "Enge Treppe",
      amount: P.extrasFlat.narrowStairs,
      detail: "Zugangsaufwand",
    });
  }

  return {
    total: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

function calculateAddonServices(data: QuoteFormData, P: PricingConstants): { total: number; items: PriceLineItem[] } {
  const items: PriceLineItem[] = [];

  if (data.includeSolar && data.solarSqm > 0) {
    items.push({
      label: "Solaranlagen-Reinigung",
      amount: Math.max(P.solarMin, data.solarSqm * P.solarPerSqm),
      detail: `${data.solarSqm} m² × ${P.solarPerSqm.toFixed(2)} €`,
    });
  }

  if (data.includeWintergarden && data.wintergardenSqm > 0) {
    items.push({
      label: "Wintergarten-Reinigung",
      amount: Math.max(P.wintergartenMin, data.wintergardenSqm * P.wintergartenPerSqm),
      detail: `${data.wintergardenSqm} m² × ${P.wintergartenPerSqm.toFixed(2)} €`,
    });
  }

  return {
    total: items.reduce((sum, item) => sum + item.amount, 0),
    items,
  };
}

function calculateWindowLines(data: QuoteFormData, P: PricingConstants): PriceLineItem[] {
  const sideMul = P.sideMultipliers[data.cleaningSide ?? "innen_aussen"];
  const dirtMul = P.dirtMultipliers[data.dirtLevel ?? "normal"];
  const heightMul = getHeightMultiplier(data.roomHeight ?? 2.5, P);
  const accessPercent = getAccessPercent(data.floorLevel, data.elevator, P);
  const lines: PriceLineItem[] = [];

  let base: number;

  if (isGewerbePricing(data)) {
    const glassSqm = data.windowCount * P.avgSqmPerFluegel;
    base = glassSqm * P.gewerbePerSqm * sideMul * dirtMul;
    lines.push({
      label: "Gewerbefenster (Basis)",
      amount: base,
      detail: `${glassSqm.toFixed(1)} m² × ${P.gewerbePerSqm.toFixed(2)} € × ${sideMul} × ${dirtMul}`,
    });
  } else {
    base = data.windowCount * P.basePerFluegel * sideMul * dirtMul;
    lines.push({
      label: "Fensterreinigung (Basis)",
      amount: base,
      detail: `${data.windowCount} Flügel × ${P.basePerFluegel.toFixed(2)} € × ${sideMul} × ${dirtMul}`,
    });
  }

  if (heightMul > 1) {
    lines.push({
      label: "Raumhöhe-Zuschlag",
      amount: base * (heightMul - 1),
      detail: `${data.roomHeight} m (×${heightMul})`,
    });
  }

  if (accessPercent > 0) {
    const baseWithHeight = base * heightMul;
    lines.push({
      label: "Etagen-Zuschlag",
      amount: baseWithHeight * accessPercent,
      detail: `+${Math.round(accessPercent * 100)} % ohne Aufzug`,
    });
  }

  return lines;
}

function sumLines(lines: PriceLineItem[]) {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

function buildEstimate(
  total: number,
  calculatedSubtotal: number,
  minimum: number,
  minimumApplied: boolean,
  breakdown: PriceLineItem[],
  label: string,
  note: string
): PriceEstimate {
  const rounded = roundTo5(total);
  const variance = Math.max(5, Math.round(rounded * 0.05));

  return {
    amount: rounded,
    min: Math.max(minimum, rounded - variance),
    max: rounded + variance,
    label,
    note,
    isIndicative: true,
    breakdown,
    calculatedSubtotal: Math.round(calculatedSubtotal * 100) / 100,
    minimumApplied,
    minimumAmount: minimum,
  };
}

export function calculatePriceEstimate(
  data: Partial<QuoteFormData>,
  overrides?: PricingOverrides,
  wartungConfig?: WartungPricingConfig
): PriceEstimate | null {
  if (!data.windowCount || data.windowCount < 1) return null;
  if (!data.services?.length) return null;

  const P = mergePricing(overrides);
  const full = data as QuoteFormData;
  const breakdown: PriceLineItem[] = [
    ...calculateWindowLines(full, P),
    ...calculateExtras(full, P).items,
    ...calculateAddonServices(full, P).items,
  ];

  const calculatedSubtotal = sumLines(breakdown);
  const minimum = getMinimum(full, P);
  const minimumApplied = calculatedSubtotal < minimum;
  let subtotal = calculatedSubtotal;

  if (minimumApplied) {
    breakdown.push({
      label: "Mindestauftragswert",
      amount: minimum - calculatedSubtotal,
      detail: `Aufstockung auf ${minimum} €`,
    });
    subtotal = minimum;
  }

  if (isWartungJob(full)) {
    const perVisit = subtotal;
    const packages = wartungConfig?.wartungPackages ?? [];
    const pkg = resolveWartungPackageForQuote(full, packages);
    if (!pkg) return null;

    const wartung = calculateWartungBreakdown(perVisit, pkg);
    const audience = getWartungAudience(full.services);
    const wartungComparisons = compareWartungPackages(perVisit, packages, audience);
    const discountLabel = Math.round(wartung.discountPercent * 100);

    const estimate = buildEstimate(
      wartung.monthlyPrice,
      calculatedSubtotal,
      wartung.minMonthly,
      wartung.minimumMonthlyApplied,
      [
        ...breakdown,
        {
          label: `Wartungsvertrag −${discountLabel} % (${pkg.labelDe})`,
          amount: 0,
          detail: `${wartung.visitsPerYear}× jährlich · ${formatEuroExact(wartung.perVisitPrice)}/Einsatz`,
        },
        {
          label: "Jahresersparnis vs. Einzelbuchung",
          amount: -wartung.yearlySavings,
          detail: `${formatEuroExact(wartung.yearlyTotal)}/Jahr`,
        },
      ],
      `ca. Monatspreis (${pkg.labelDe})`,
      `Basierend auf ${formatEuroExact(perVisit)}/Einsatz, −${discountLabel} % Vertragsrabatt, ${wartung.visitsPerYear}× jährlich. Sie sparen ca. ${formatEuro(wartung.yearlySavings)}/Jahr.`
    );
    return { ...estimate, wartung, wartungComparisons };
  }

  return buildEstimate(
    subtotal,
    calculatedSubtotal,
    minimum,
    minimumApplied,
    breakdown,
    siteConfig.messaging.priceEstimateLabel,
    minimumApplied
      ? `Berechnet: ${Math.round(calculatedSubtotal)} € – Mindestauftrag ${minimum} € greift.`
      : siteConfig.messaging.priceEstimateNote
  );
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEuroExact(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
