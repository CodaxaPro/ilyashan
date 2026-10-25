/** Treppenhausreinigung orientation pricing — NRW mid, calibrated to Ilyashan ops. */

export type StairTurnus = "weekly" | "biweekly" | "monthly";
export type KellerTurnus = StairTurnus;
export type DirtLevel = "normal" | "medium" | "heavy";

export type TreppenhausInput = {
  stockwerke: number;
  wohnungen: number;
  stairTurnus: StairTurnus;
  dirtLevel: DirtLevel;
  keller: boolean;
  kellerTurnus: KellerTurnus;
  aufzug: boolean;
  glasHandlauf: boolean;
};

export type TreppenhausQuote = {
  stairVisitNetCents: number;
  kellerVisitNetCents: number;
  stairMonthlyNetCents: number;
  kellerMonthlyNetCents: number;
  monthlyNetCents: number;
  monthlyGrossCents: number;
  vatCents: number;
  stairVisitsPerMonth: number;
  kellerVisitsPerMonth: number;
  needsInspection: boolean;
  dirtFactor: number;
  weeklyPackageFactor: number;
};

export const TREPPENHAUS_PRICING = {
  baseVisitEuro: 70,
  perStockwerkEuro: 7,
  perWohnungEuro: 3,
  kellerVisitEuro: 12,
  aufzugVisitEuro: 8,
  glasVisitEuro: 10,
  minMonthlyNetEuro: 110,
  vatRate: 0.19,
  weeklyPackageFactor: 0.85,
  dirtFactors: {
    normal: 1,
    medium: 1.15,
    heavy: 1.3,
  } as const satisfies Record<DirtLevel, number>,
  visitsPerMonth: {
    weekly: 4,
    biweekly: 2,
    monthly: 1,
  } as const satisfies Record<StairTurnus, number>,
  maxOnlineStockwerke: 8,
  maxOnlineWohnungen: 16,
} as const;

export function allowedKellerTurnus(stairTurnus: StairTurnus): KellerTurnus[] {
  if (stairTurnus === "weekly") return ["weekly", "monthly"];
  if (stairTurnus === "biweekly") return ["biweekly", "monthly"];
  return ["monthly"];
}

/** Keep Keller turnus valid when stair turnus changes; prefer same cadence, else monthly. */
export function syncKellerTurnus(
  stairTurnus: StairTurnus,
  currentKeller: KellerTurnus
): KellerTurnus {
  const allowed = allowedKellerTurnus(stairTurnus);
  if (allowed.includes(currentKeller)) return currentKeller;
  if (allowed.includes(stairTurnus)) return stairTurnus;
  return "monthly";
}

function euroToCents(euro: number): number {
  return Math.round(euro * 100);
}

function packageFactor(turnus: StairTurnus): number {
  return turnus === "weekly" ? TREPPENHAUS_PRICING.weeklyPackageFactor : 1;
}

export function calculateTreppenhausQuote(input: TreppenhausInput): TreppenhausQuote {
  const stockwerke = clamp(input.stockwerke, 1, 12);
  const wohnungen = clamp(input.wohnungen, 1, 40);
  const dirtFactor = TREPPENHAUS_PRICING.dirtFactors[input.dirtLevel];

  const stairVisitEuro =
    TREPPENHAUS_PRICING.baseVisitEuro +
    stockwerke * TREPPENHAUS_PRICING.perStockwerkEuro +
    wohnungen * TREPPENHAUS_PRICING.perWohnungEuro +
    (input.aufzug ? TREPPENHAUS_PRICING.aufzugVisitEuro : 0) +
    (input.glasHandlauf ? TREPPENHAUS_PRICING.glasVisitEuro : 0);

  const stairVisits = TREPPENHAUS_PRICING.visitsPerMonth[input.stairTurnus];
  const stairWeeklyFactor = packageFactor(input.stairTurnus);
  const stairMonthlyEuro = stairVisitEuro * stairVisits * stairWeeklyFactor * dirtFactor;

  const kellerTurnus = input.keller
    ? syncKellerTurnus(input.stairTurnus, input.kellerTurnus)
    : input.kellerTurnus;
  const kellerVisits = input.keller ? TREPPENHAUS_PRICING.visitsPerMonth[kellerTurnus] : 0;
  const kellerWeeklyFactor = input.keller ? packageFactor(kellerTurnus) : 1;
  const kellerVisitEuro = input.keller ? TREPPENHAUS_PRICING.kellerVisitEuro : 0;
  const kellerMonthlyEuro = input.keller
    ? kellerVisitEuro * kellerVisits * kellerWeeklyFactor * dirtFactor
    : 0;

  const rawMonthly = stairMonthlyEuro + kellerMonthlyEuro;
  const monthlyNetEuro = Math.max(TREPPENHAUS_PRICING.minMonthlyNetEuro, rawMonthly);
  const monthlyNetCents = euroToCents(monthlyNetEuro);
  const vatCents = Math.round(monthlyNetCents * TREPPENHAUS_PRICING.vatRate);
  const monthlyGrossCents = monthlyNetCents + vatCents;

  return {
    stairVisitNetCents: euroToCents(stairVisitEuro),
    kellerVisitNetCents: euroToCents(kellerVisitEuro),
    stairMonthlyNetCents: euroToCents(stairMonthlyEuro),
    kellerMonthlyNetCents: euroToCents(kellerMonthlyEuro),
    monthlyNetCents,
    monthlyGrossCents,
    vatCents,
    stairVisitsPerMonth: stairVisits,
    kellerVisitsPerMonth: kellerVisits,
    needsInspection:
      stockwerke > TREPPENHAUS_PRICING.maxOnlineStockwerke ||
      wohnungen > TREPPENHAUS_PRICING.maxOnlineWohnungen,
    dirtFactor,
    weeklyPackageFactor: stairWeeklyFactor,
  };
}

export function formatEuroFromCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}
