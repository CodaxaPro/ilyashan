import { addDaysIso, toIsoDate } from "@/lib/calendar/week-range";

/** Default booking horizon for customer self-service (days). */
export const DEFAULT_BOOKING_HORIZON_DAYS = 42;

/** Earliest bookable offset from today (lead time). */
export const DEFAULT_BOOKING_LEAD_DAYS = 2;

export function getDefaultBookingRange(
  today: Date = new Date(),
  horizonDays = DEFAULT_BOOKING_HORIZON_DAYS,
  leadDays = DEFAULT_BOOKING_LEAD_DAYS
): { from: string; to: string } {
  const from = addDaysIso(toIsoDate(today), leadDays);
  const to = addDaysIso(from, horizonDays - 1);
  return { from, to };
}
