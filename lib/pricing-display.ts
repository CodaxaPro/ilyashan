import { RECOMMENDED_PRICING as P } from "@/lib/pricing-market-research";

export function formatEuroDe(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

export function formatBasePerFluegelHint(basePerFluegel: number): string {
  return `${formatEuroDe(basePerFluegel)} €/Flügel`;
}

export function formatBasePerFluegelDescription(basePerFluegel: number): string {
  return `Basispreis ${formatEuroDe(basePerFluegel)} €/Flügel = Glas innen & außen (normal), ohne Rahmen. Multiplikatoren und Zuschläge werden live berechnet.`;
}

export function formatPriceEstimateBasisLine(basePerFluegel: number, region: string): string {
  return `Basis: ${formatEuroDe(basePerFluegel)} €/Flügel (i+a, normal) · ${region}`;
}

export function formatNarrowStairsHint(): string {
  return `+${formatEuroDe(P.extrasFlat.narrowStairs)} € pauschal`;
}

export function formatNarrowStairsRowLabel(): string {
  return `Enge Treppe (+${formatEuroDe(P.extrasFlat.narrowStairs)} €)`;
}

export function formatCanopyHint(): string {
  return `${formatEuroDe(P.extrasFlat.canopyPerSqm)} €/m² · mindestens ${formatEuroDe(P.extrasFlat.canopy)} €`;
}

export function formatMinimumWohnungHint(minimumWohnung: number): string {
  return `Live berechnet · ab ${minimumWohnung} €`;
}
