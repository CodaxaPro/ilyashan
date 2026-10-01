import type { StoredLead } from "@/lib/leads-store";
import type { CleaningQuoteSnapshot } from "@/lib/cleaning/snapshot";
import { centsToEuros } from "@/lib/cleaning/money";

export type LeadServiceLine = "fenster" | "buero";

export function getLeadServiceLine(
  lead: Pick<StoredLead, "serviceLine" | "cleaningSnapshot" | "quote">
): LeadServiceLine {
  if (lead.serviceLine === "buero" || lead.cleaningSnapshot) return "buero";
  return "fenster";
}

export function isBueroLead(
  lead: Pick<StoredLead, "serviceLine" | "cleaningSnapshot">
): boolean {
  return getLeadServiceLine(lead) === "buero";
}

/** Complete enough for termin / status email / calendar (product-aware). */
export function isCompleteQuoteLead(
  lead: Pick<StoredLead, "source" | "serviceLine" | "cleaningSnapshot" | "quote">
): boolean {
  if (lead.source !== "quote") return false;
  if (isBueroLead(lead)) {
    return Boolean(lead.cleaningSnapshot?.input?.totalAreaM2);
  }
  return Boolean(lead.quote?.windowCount);
}

export function getBueroSnapshot(
  lead: Pick<StoredLead, "cleaningSnapshot">
): CleaningQuoteSnapshot | null {
  return lead.cleaningSnapshot ?? null;
}

/** Duration hours for schedule emails / booking — product-aware. */
export function resolveLeadEstimatedHours(
  lead: Pick<StoredLead, "appointment" | "cleaningSnapshot" | "quote" | "serviceLine">
): number {
  if (typeof lead.appointment?.estimatedDurationHours === "number") {
    return lead.appointment.estimatedDurationHours;
  }
  if (isBueroLead(lead)) {
    const h = lead.cleaningSnapshot?.customer.estimatedOnsiteHours;
    if (typeof h === "number" && h > 0) return h;
    return 3;
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
