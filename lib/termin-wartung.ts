import type { StoredLead } from "@/lib/leads-store";
import {
  formatGermanDate,
  initialQuoteFormData,
  preferredTimeSlotLabels,
  preferredWeekdayLabels,
  type PreferredWeekday,
  type QuoteFormData,
} from "@/lib/quote-form";
import { generateWartungSeriesDates, alignToPreferredWeekday } from "@/lib/calendar/wartung-series";
import { getWartungPackageById, DEFAULT_WARTUNG_PACKAGES, type WartungPackageId } from "@/lib/wartung-packages";
import { isoWeekday } from "@/lib/scheduling/slot-engine";
import { getDefaultBookingRange } from "@/lib/scheduling/booking-range";

const WEEKDAY_TO_ISO: Record<Exclude<PreferredWeekday, "">, number> = {
  mo: 1,
  di: 2,
  mi: 3,
  do: 4,
  fr: 5,
  sa: 6,
};

export interface TerminWartungContext {
  packageId: WartungPackageId;
  packageLabel: string;
  weekdayLabel: string;
  timeSlotLabel: string;
  planSummaryDe: string;
  preferredWeekday: PreferredWeekday;
  previewDates: string[];
  previewDateLabels: string[];
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

export function isWartungQuote(quote: QuoteFormData): boolean {
  return quote.services.includes("wartung") && Boolean(quote.wartungPackageId);
}

export function dateMatchesPreferredWeekday(date: string, weekday: PreferredWeekday): boolean {
  if (!weekday) return true;
  return isoWeekday(date) === WEEKDAY_TO_ISO[weekday];
}

export function wartungWeekdayErrorDe(weekday: PreferredWeekday): string {
  const label = weekday ? preferredWeekdayLabels[weekday] : "Wunschtag";
  return `Bitte wählen Sie einen ${label} für Ihren Wartungsvertrag.`;
}

export function buildTerminWartungContext(
  lead: StoredLead,
  anchorDate?: string
): TerminWartungContext | null {
  const quote = mergeQuote(lead.quote);
  if (!quote || !isWartungQuote(quote)) return null;

  const packageId = quote.wartungPackageId as WartungPackageId;
  const pkg = getWartungPackageById(DEFAULT_WARTUNG_PACKAGES, packageId);
  if (!pkg) return null;

  const weekday = quote.wartungPreferredWeekday;
  const weekdayLabel = weekday ? preferredWeekdayLabels[weekday] : "Flexibel";
  const timeSlot = quote.wartungPreferredTimeSlot;
  const timeSlotLabel = timeSlot ? preferredTimeSlotLabels[timeSlot] : "Flexibel";

  const planSummaryDe = `${pkg.labelDe} · ${weekdayLabel} · ${timeSlotLabel}`;

  const anchor =
    anchorDate ??
    lead.appointment?.confirmedDate ??
    lead.appointment?.proposedDate;

  const previewAnchor =
    anchor ??
    (weekday ? alignToPreferredWeekday(getDefaultBookingRange().from, weekday) : undefined);

  const previewDates =
    previewAnchor && weekday
      ? generateWartungSeriesDates({
          anchorDate: previewAnchor,
          packageId,
          preferredWeekday: weekday,
        }).slice(0, 4)
      : [];

  return {
    packageId,
    packageLabel: pkg.labelDe,
    weekdayLabel,
    timeSlotLabel,
    planSummaryDe,
    preferredWeekday: weekday,
    previewDates,
    previewDateLabels: previewDates.map((d) => formatGermanDate(d)),
  };
}

export function filterDaysForWartung<T extends { date: string; available: boolean }>(
  days: T[],
  preferredWeekday: PreferredWeekday
): T[] {
  if (!preferredWeekday) return days;
  return days.map((day) => {
    const matches = dateMatchesPreferredWeekday(day.date, preferredWeekday);
    if (!matches) {
      return { ...day, available: false };
    }
    return day;
  });
}
