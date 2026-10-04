import type { CleaningFrequency } from "./types";
import { cents, type EuroCents } from "./money";

/** Average weeks per calendar month — industry standard for recurring Unterhalt. */
export const WEEKS_PER_MONTH_AVG = 52 / 12;

/**
 * Visits per week for commercial indication.
 * CUSTOM uses customFrequencyPerWeek when provided; otherwise null (no monthly).
 */
export function visitsPerWeekForFrequency(
  frequency: CleaningFrequency,
  customFrequencyPerWeek?: number
): number | null {
  switch (frequency) {
    case "1_PER_WEEK":
      return 1;
    case "2_PER_WEEK":
      return 2;
    case "3_PER_WEEK":
      return 3;
    case "5_PER_WEEK":
      return 5;
    case "CUSTOM": {
      if (
        typeof customFrequencyPerWeek === "number" &&
        Number.isFinite(customFrequencyPerWeek) &&
        customFrequencyPerWeek > 0
      ) {
        return customFrequencyPerWeek;
      }
      return null;
    }
    case "ONE_TIME":
    default:
      return null;
  }
}

/**
 * Monthly net indication from per-visit net:
 * visits/week × (52/12) × net/visit — not calendar-day exact.
 */
export function estimateMonthlyNetCents(
  netPerVisitCents: number,
  frequency: CleaningFrequency,
  customFrequencyPerWeek?: number
): EuroCents | null {
  const perWeek = visitsPerWeekForFrequency(frequency, customFrequencyPerWeek);
  if (perWeek == null || netPerVisitCents <= 0) return null;
  return cents(Math.round(netPerVisitCents * perWeek * WEEKS_PER_MONTH_AVG));
}

export function estimateMonthlyGrossCents(
  monthlyNetCents: number,
  vatRateBps: number
): EuroCents {
  return cents(Math.round(monthlyNetCents + (monthlyNetCents * vatRateBps) / 10_000));
}
