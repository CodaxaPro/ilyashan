import type { StoredLead } from "@/lib/leads-store";
import type { CleaningQuoteSnapshot } from "@/lib/cleaning/snapshot";
import { centsToEuros } from "@/lib/cleaning/money";

export type LeadServiceLine = "fenster" | "buero" | "treppenhaus";

export function getLeadServiceLine(
  lead: Pick<StoredLead, "serviceLine" | "cleaningSnapshot" | "treppenhausSnapshot" | "quote">
): LeadServiceLine {
  if (lead.serviceLine === "buero" || lead.cleaningSnapshot) return "buero";
  if (lead.serviceLine === "treppenhaus" || lead.treppenhausSnapshot) return "treppenhaus";
  return "fenster";
}

export function isBueroLead(
  lead: Pick<StoredLead, "serviceLine" | "cleaningSnapshot">
): boolean {
  return lead.serviceLine === "buero" || Boolean(lead.cleaningSnapshot);
}

export function isTreppenhausLead(
  lead: Pick<StoredLead, "serviceLine" | "treppenhausSnapshot">
): boolean {
  return lead.serviceLine === "treppenhaus" || Boolean(lead.treppenhausSnapshot);
}

/** Product payload complete enough to schedule (source-agnostic). */
export function hasBookableProductData(
  lead: Pick<
    StoredLead,
    "serviceLine" | "cleaningSnapshot" | "treppenhausSnapshot" | "quote" | "status"
  >
): boolean {
  if (lead.status === "abgelehnt" || lead.status === "abgeschlossen") return false;
  if (isBueroLead(lead)) {
    return Boolean(lead.cleaningSnapshot?.input?.totalAreaM2);
  }
  if (isTreppenhausLead(lead)) {
    return Boolean(lead.treppenhausSnapshot?.input?.stockwerke);
  }
  return Boolean(lead.quote?.windowCount);
}

/**
 * Online customer booking gate — same scheduler as Termin-Portal.
 * Requires quote source so calendar sync (`deriveAppointmentsFromLead`) accepts the lead.
 */
export function canCustomerBookOnline(
  lead: Pick<
    StoredLead,
    | "source"
    | "serviceLine"
    | "cleaningSnapshot"
    | "treppenhausSnapshot"
    | "quote"
    | "status"
  >
): boolean {
  if (lead.source !== "quote") return false;
  return hasBookableProductData(lead);
}

/** Complete enough for termin / status email / calendar (product-aware). */
export function isCompleteQuoteLead(
  lead: Pick<
    StoredLead,
    "source" | "serviceLine" | "cleaningSnapshot" | "treppenhausSnapshot" | "quote"
  >
): boolean {
  return canCustomerBookOnline(lead);
}

export function getBueroSnapshot(
  lead: Pick<StoredLead, "cleaningSnapshot">
): CleaningQuoteSnapshot | null {
  return lead.cleaningSnapshot ?? null;
}

/** Duration hours for schedule emails / booking — product-aware. */
export function resolveLeadEstimatedHours(
  lead: Pick<
    StoredLead,
    "appointment" | "cleaningSnapshot" | "treppenhausSnapshot" | "quote" | "serviceLine"
  >
): number {
  if (typeof lead.appointment?.estimatedDurationHours === "number") {
    return lead.appointment.estimatedDurationHours;
  }
  if (isBueroLead(lead)) {
    const h = lead.cleaningSnapshot?.customer.estimatedOnsiteHours;
    if (typeof h === "number" && h > 0) return h;
    return 3;
  }
  if (isTreppenhausLead(lead)) {
    const floors = lead.treppenhausSnapshot?.input.stockwerke ?? 3;
    if (floors <= 3) return 1.5;
    if (floors <= 5) return 2;
    return 2.5;
  }
  const n = lead.quote?.windowCount ?? 0;
  if (n <= 6) return 1.5;
  if (n <= 12) return 2.5;
  if (n <= 20) return 3.5;
  if (n <= 30) return 4.5;
  return 6;
}

/** Default Festpreis in EUR (display Endpreis). Büro uses snapshot gross. */
export function getBueroDefaultFestpreisEuros(
  lead: Pick<StoredLead, "festpreis" | "cleaningSnapshot">
): number | undefined {
  if (typeof lead.festpreis === "number" && lead.festpreis > 0) {
    return Math.round(lead.festpreis);
  }
  const gross = lead.cleaningSnapshot?.customer.grossCents;
  if (typeof gross === "number" && gross > 0) {
    return Math.round(centsToEuros(gross));
  }
  return undefined;
}
