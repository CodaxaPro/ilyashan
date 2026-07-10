import type {
  ElevatorOption,
  FloorLevel,
  QuoteFormData,
} from "@/lib/quote-form";
import { siteConfig } from "@/lib/config";
import { RECOMMENDED_PRICING as P } from "@/lib/pricing-market-research";

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
}

function roundTo5(value: number) {
  return Math.round(value / 5) * 5;
}

function getMinimum(data: QuoteFormData) {
  if (data.services.includes("gewerbe") || data.objectType === "gewerbe") {
    return P.minimumGewerbe;
  }
  if (data.objectType === "haus") return P.minimumHaus;
  return P.minimumWohnung;
}

function getHeightMultiplier(height: number) {
  if (height > 4) return P.heightMultipliers.above4m;
  if (height > 3) return P.heightMultipliers.above3m;
  return P.heightMultipliers.default;
}

function getAccessPercent(floorLevel: FloorLevel | "", elevator: ElevatorOption | "") {
  if (!floorLevel || elevator === "ja" || floorLevel === "eg") return 0;
  const base = P.floorAccessPercent[floorLevel] ?? 0;
  const factor = elevator === "unbekannt" ? P.elevatorUnbekanntFactor : 1;
  return base * factor;
}

/** Gewerbe-Modell nur wenn Leistung „Gewerbe“ gewählt – nicht nur Objektart */
function isGewerbePricing(data: QuoteFormData) {
  return data.services.includes("gewerbe");
}

function isWartungJob(data: QuoteFormData) {
  return data.services.includes("wartung");
}

function calculateExtras(data: QuoteFormData): { total: number; items: PriceLineItem[] } {
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

function calculateAddonServices(data: QuoteFormData): { total: number; items: PriceLineItem[] } {
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

function calculateWindowLines(data: QuoteFormData): PriceLineItem[] {
  const sideMul = P.sideMultipliers[data.cleaningSide ?? "innen_aussen"];
  const dirtMul = P.dirtMultipliers[data.dirtLevel ?? "normal"];
  const heightMul = getHeightMultiplier(data.roomHeight ?? 2.5);
  const accessPercent = getAccessPercent(data.floorLevel, data.elevator);
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

export function calculatePriceEstimate(data: Partial<QuoteFormData>): PriceEstimate | null {
  if (!data.windowCount || data.windowCount < 1) return null;
  if (!data.services?.length) return null;

  const full = data as QuoteFormData;
  const breakdown: PriceLineItem[] = [
    ...calculateWindowLines(full),
    ...calculateExtras(full).items,
    ...calculateAddonServices(full).items,
  ];

  const calculatedSubtotal = sumLines(breakdown);
  const minimum = getMinimum(full);
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
    const yearly = perVisit * P.wartungVisitsPerYear * (1 - P.wartungDiscount);
    const monthly = Math.max(P.wartungMinMonthly, roundTo5(yearly / 12));
    return buildEstimate(
      monthly,
      calculatedSubtotal,
      P.wartungMinMonthly,
      monthly <= P.wartungMinMonthly,
      [
        ...breakdown,
        {
          label: "Wartungsvertrag (−25 %)",
          amount: 0,
          detail: `${P.wartungVisitsPerYear}× jährlich, Monatsrate`,
        },
      ],
      "ca. Monatspreis (Wartungsvertrag)",
      `Basierend auf ${formatEuroExact(perVisit)}/Einsatz, −${Math.round(P.wartungDiscount * 100)} % Vertragsrabatt.`
    );
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
