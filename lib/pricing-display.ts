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

export function formatGewerbeBaseDescription(
  gewerbePerSqm = P.gewerbePerSqm,
  avgSqmPerFluegel = P.avgSqmPerFluegel
): string {
  return `Gewerbe-Basis ${formatEuroDe(gewerbePerSqm)} €/m² Glas (normal). Orientierung: ca. ${formatEuroDe(avgSqmPerFluegel)} m² je Flügel. Multiplikatoren und Zuschläge werden live berechnet.`;
}

export type PriceBasisMode = "privat" | "gewerbe";

/** Footer under live estimate – must match the active calculation model. */
export function formatPriceEstimateBasisLine(options: {
  mode: PriceBasisMode;
  region: string;
  basePerFluegel?: number;
  gewerbePerSqm?: number;
}): string {
  if (options.mode === "gewerbe") {
    const rate = options.gewerbePerSqm ?? P.gewerbePerSqm;
    return `Basis: ${formatEuroDe(rate)} €/m² Glas (Gewerbe, normal) · ${options.region}`;
  }
  const base = options.basePerFluegel ?? P.basePerFluegel;
  return `Basis: ${formatEuroDe(base)} €/Flügel (i+a, normal) · ${options.region}`;
}

export function resolvePriceBasisMode(
  data: { services?: readonly string[] } | null | undefined
): PriceBasisMode {
  return data?.services?.includes("gewerbe") ? "gewerbe" : "privat";
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

export function formatSkylightsHint(): string {
  return `${formatEuroDe(P.extrasFlat.skylights)} €/Stück`;
}

export function formatFlyScreensHint(): string {
  return `${formatEuroDe(P.extrasFlat.flyScreens)} €/Stück · ausgebaut / innen zugänglich`;
}

/** 49 € = Wohnung-Mindestauftrag – kein festes Paket „einseitig“ oder „innen+außen“. */
export function formatMinimumWohnungHint(minimumWohnung: number): string {
  return `Live berechnet · Mindestauftrag ab ${minimumWohnung} €`;
}

export function formatMinimumWohnungScopeHint(minimumWohnung = P.minimumWohnung): string {
  return `Mindestauftrag Wohnung ab ${minimumWohnung} € · Reinigungsumfang (innen/außen) im Wizard`;
}

/** Homepage / ServiceHub – gleicher Scope-Standard wie Wizard */
export function formatPrivatHomeServiceDescription(minimumWohnung = P.minimumWohnung): string {
  return `Wohnung & Haus – streifenfreie Glasreinigung. ${formatMinimumWohnungScopeHint(minimumWohnung)}.`;
}

/** Angebots-Wizard Step 1 – Preis nicht an festen Umfang koppeln */
export function formatPrivatQuoteServiceDescription(): string {
  return "Wohnung & Haus – streifenfrei; Umfang (innen/außen) im Wizard";
}
