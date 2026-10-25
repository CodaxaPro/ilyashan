import type { ConciergeSession } from "./types";
import { quoteDataForEstimate } from "./pricing-response";
import { calculatePriceEstimate } from "@/lib/pricing";
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
import { formatEstimateRangeLabel, resolvePriceAudience } from "@/lib/vat-display";
import {
  calculateTreppenhausQuote,
  formatEuroFromCents,
} from "@/lib/treppenhaus/pricing";
import {
  getTreppenhausDraft,
  isTreppenhausComplete,
} from "@/lib/assistant/dialog/treppenhaus";

export function isHotLead(session: ConciergeSession): boolean {
  if (session.stage === "price_ready") return true;
  if (session.quote.windowCount && session.quote.floorLevel) return true;
  if (session.assistantProduct === "treppenhaus" && isTreppenhausComplete(getTreppenhausDraft(session))) {
    return true;
  }
  if (
    session.assistantProduct === "buero" &&
    session.bueroDraft?.totalAreaM2 &&
    session.bueroDraft?.frequency
  ) {
    return true;
  }
  return false;
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

  if (session.assistantProduct) {
    rows.push(["Assistent-Produkt", session.assistantProduct]);
  }
  if (session.salesNotes) {
    rows.push(["Kundennotiz", session.salesNotes]);
  }
  if (session.bueroDraft?.totalAreaM2) {
    rows.push(["Büro m²", String(session.bueroDraft.totalAreaM2)]);
    if (session.bueroDraft.frequency) {
      rows.push(["Büro-Turnus", session.bueroDraft.frequency]);
    }
  }

  const trp = getTreppenhausDraft(session);
  if (session.assistantProduct === "treppenhaus" || Object.keys(trp).length > 0) {
    if (trp.stockwerke) rows.push(["Stockwerke", String(trp.stockwerke)]);
    if (trp.wohnungen) rows.push(["Wohnungen", String(trp.wohnungen)]);
    if (trp.stairTurnus) rows.push(["Treppen-Turnus", trp.stairTurnus]);
    if (trp.dirtLevel) rows.push(["Verschmutzung", trp.dirtLevel]);
    if (trp.keller !== undefined) {
      rows.push([
        "Keller",
        trp.keller ? `ja (${trp.kellerTurnus ?? "—"})` : "nein",
      ]);
    }
    if (isTreppenhausComplete(trp)) {
      const quote = calculateTreppenhausQuote(trp);
      rows.push([
        "Treppenhaus-Orientierung",
        `${formatEuroFromCents(quote.monthlyGrossCents)} brutto / Monat`,
      ]);
    }
  }

  const data = quoteDataForEstimate(q);
  if (data) {
    const est = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig);
    if (est && est.amount > 0) {
      rows.push([
        "Live-Preisschätzung",
        formatEstimateRangeLabel(est.min, est.max, resolvePriceAudience(data)),
      ]);
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
