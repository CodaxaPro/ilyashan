import type { ConciergeSession } from "./types";
import { quoteDataForEstimate } from "./pricing-response";
import { calculatePriceEstimate, formatEuro } from "@/lib/pricing";
import {
  cleaningSideLabels,
  getFloorLabel,
  quoteServiceLabels,
} from "@/lib/quote-form";
import type { QuoteFormData } from "@/lib/quote-form";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";

export function isHotLead(session: ConciergeSession): boolean {
  return session.stage === "price_ready" || (!!session.quote.windowCount && !!session.quote.floorLevel);
}

export function buildLeadSummaryRows(
  session: ConciergeSession,
  ctx: QuotePricingContext = defaultQuotePricingContext()
): [string, string][] {
  const q = session.quote;
  const rows: [string, string][] = [["Session-ID", session.id]];

  if (q.services?.length) {
    rows.push(["Leistung", q.services.map((s) => quoteServiceLabels[s]).join(", ")]);
  }
  if (q.windowCount) rows.push(["Fensterflügel", String(q.windowCount)]);
  if (q.floorLevel) {
    rows.push(["Etage", getFloorLabel(q as Pick<QuoteFormData, "floorLevel">)]);
  }
  if (q.cleaningSide) rows.push(["Umfang", cleaningSideLabels[q.cleaningSide]]);
  if (q.postalCode || q.city) {
    rows.push(["Ort", [q.postalCode, q.city].filter(Boolean).join(" ")]);
  }

  const data = quoteDataForEstimate(q);
  if (data) {
    const est = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig);
    if (est && est.amount > 0) {
      rows.push(["Live-Preisschätzung", `ca. ${formatEuro(est.min)}–${formatEuro(est.max)}`]);
    }
  }

  rows.push(["Assistent-Schritte", String(session.turns)]);
  return rows;
}

export function validateLeadContact(name: string, phone: string): string | null {
  if (!name.trim() || name.trim().length < 2) {
    return "Bitte geben Sie Ihren Namen an.";
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) {
    return "Bitte geben Sie eine gültige Telefonnummer an.";
  }
  return null;
}
