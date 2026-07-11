import type { WartungPackageId } from "@/lib/wartung-packages";
import { DEFAULT_WARTUNG_PACKAGES } from "@/lib/wartung-packages";
import type { PreferredWeekday } from "@/lib/quote-form";
import { addDaysIso, parseIsoDate, toIsoDate } from "@/lib/calendar/week-range";

export const WARTUNG_SERIES_HORIZON_MONTHS = 12;
export const MAX_WARTUNG_SERIES_VISITS = 52;

const WEEKDAY_TO_JS: Record<Exclude<PreferredWeekday, "">, number> = {
  mo: 1,
  di: 2,
  mi: 3,
  do: 4,
  fr: 5,
  sa: 6,
};

export function intervalDaysForPackage(packageId: WartungPackageId): number {
  const pkg = DEFAULT_WARTUNG_PACKAGES.find((p) => p.id === packageId);
  if (!pkg || pkg.visitsPerYear <= 0) return 28;
  return Math.max(7, Math.round(365 / pkg.visitsPerYear));
}

export function maxSeriesVisitsForPackage(packageId: WartungPackageId, horizonMonths = WARTUNG_SERIES_HORIZON_MONTHS): number {
  const interval = intervalDaysForPackage(packageId);
  const horizonDays = Math.round(horizonMonths * (365 / 12));
  const pkg = DEFAULT_WARTUNG_PACKAGES.find((p) => p.id === packageId);
  const cap = pkg?.visitsPerYear ?? MAX_WARTUNG_SERIES_VISITS;
  return Math.min(cap, Math.ceil(horizonDays / interval), MAX_WARTUNG_SERIES_VISITS);
}

/** Next occurrence on preferred weekday on or after `iso` (Mon–Sat only). */
export function alignToPreferredWeekday(iso: string, weekday: PreferredWeekday): string {
  if (!weekday) return iso;
  const target = WEEKDAY_TO_JS[weekday];
  const date = parseIsoDate(iso);
  for (let i = 0; i < 14; i++) {
    const probe = new Date(date);
    probe.setDate(date.getDate() + i);
    const dow = probe.getDay();
    if (dow === 0) {
      continue;
    }
    const mapped = dow === 0 ? 7 : dow;
    if (mapped === target) return toIsoDate(probe);
  }
  return iso;
}

export function addMonthsIso(iso: string, months: number): string {
  const d = parseIsoDate(iso);
  d.setMonth(d.getMonth() + months);
  return toIsoDate(d);
}

export function wartungSeriesRole(index: number): `wartung-${number}` {
  return `wartung-${index}`;
}

export function isWartungSeriesRole(role: string): role is `wartung-${number}` {
  return /^wartung-\d+$/.test(role);
}

/** Future Wartung visit dates after anchor (excludes anchor itself). */
export function generateWartungSeriesDates(input: {
  anchorDate: string;
  packageId: WartungPackageId;
  preferredWeekday?: PreferredWeekday;
  horizonMonths?: number;
}): string[] {
  const horizonMonths = input.horizonMonths ?? WARTUNG_SERIES_HORIZON_MONTHS;
  const interval = intervalDaysForPackage(input.packageId);
  const endDate = addMonthsIso(input.anchorDate, horizonMonths);
  const maxVisits = maxSeriesVisitsForPackage(input.packageId, horizonMonths);

  const dates: string[] = [];
  let current = addDaysIso(input.anchorDate, interval);

  while (current <= endDate && dates.length < maxVisits) {
    let candidate = input.preferredWeekday
      ? alignToPreferredWeekday(current, input.preferredWeekday)
      : current;

    if (parseIsoDate(candidate).getDay() === 0) {
      candidate = addDaysIso(candidate, 1);
    }

    if (candidate > endDate) break;
    if (!dates.includes(candidate)) dates.push(candidate);

    current = addDaysIso(candidate, interval);
  }

  return dates;
}
