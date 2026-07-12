import type { LeadStatus, StoredLead } from "@/lib/leads-store";
import { getServicesLabel } from "@/lib/quote-summary";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import { toIsoDate } from "@/lib/calendar/week-range";

export const LEAD_STATUS_LABELS_DE: Record<LeadStatus, string> = {
  neu: "Anfrage eingegangen",
  kontaktiert: "In Bearbeitung",
  termin_vorgeschlagen: "Terminvorschlag offen",
  termin_bestaetigt: "Termin bestätigt",
  abgeschlossen: "Abgeschlossen",
  abgelehnt: "Abgelehnt",
};

export interface TerminPortalSummary {
  status: LeadStatus;
  statusLabelDe: string;
  servicesLabel: string;
  priceLabel?: string;
  locationLabel?: string;
  windowCount?: number;
  canDownloadPdf: boolean;
  canReschedule: boolean;
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

export function canCustomerReschedule(lead: StoredLead, today = toIsoDate(new Date())): boolean {
  const confirmed = lead.appointment?.confirmedDate;
  if (!confirmed) return false;
  if (lead.status === "abgeschlossen" || lead.status === "abgelehnt") return false;
  return confirmed > today;
}

export function buildTerminPortalSummary(lead: StoredLead): TerminPortalSummary | null {
  const quote = mergeQuote(lead.quote);
  if (!quote) return null;

  const status = lead.status ?? "neu";
  const location = [quote.postalCode, quote.city].filter(Boolean).join(" ");

  return {
    status,
    statusLabelDe: LEAD_STATUS_LABELS_DE[status],
    servicesLabel: getServicesLabel(quote),
    priceLabel: lead.priceSnapshot?.priceLabel,
    locationLabel: location || undefined,
    windowCount: quote.windowCount,
    canDownloadPdf: Boolean(lead.quote?.windowCount),
    canReschedule: canCustomerReschedule(lead),
  };
}
