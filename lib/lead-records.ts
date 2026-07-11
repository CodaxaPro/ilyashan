import type { ConciergeSession } from "@/lib/concierge/types";
import { quoteDataForEstimate } from "@/lib/concierge/pricing-response";
import { buildLeadSummaryRows } from "@/lib/concierge/lead";
import type { QuoteFormData } from "@/lib/quote-form";
import { buildQuotePlainText } from "@/lib/quote-summary";
import type { LeadSource, StoredLead } from "@/lib/leads-store";
import { createLeadId } from "@/lib/leads-store";
import { isHotLead } from "@/lib/concierge/lead";
import { getQuoteContactName } from "@/lib/quote-summary";
import {
  captureQuotePriceSnapshot,
  type QuotePriceSnapshot,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";

export function buildConciergeLeadSummary(
  session: ConciergeSession,
  ctx?: QuotePricingContext
): string {
  return buildLeadSummaryRows(session, ctx)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function createQuoteStoredLead(
  quote: QuoteFormData,
  anfrageNr: string,
  photoCount: number,
  ctx: QuotePricingContext,
  priceSnapshot?: QuotePriceSnapshot | null
): StoredLead {
  return {
    id: createLeadId("quote"),
    source: "quote",
    createdAt: new Date().toISOString(),
    name: getQuoteContactName(quote),
    phone: quote.phone,
    email: quote.email || undefined,
    anfrageNr,
    status: "neu",
    summary: buildQuotePlainText(quote, anfrageNr, ctx),
    photoCount,
    priceSnapshot: priceSnapshot ?? undefined,
    quote,
  };
}

export function createConciergeStoredLead(
  session: ConciergeSession,
  name: string,
  phone: string,
  photoCount: number,
  ctx?: QuotePricingContext
): StoredLead {
  const estimateData = ctx ? quoteDataForEstimate(session.quote) : null;
  const priceSnapshot =
    ctx && estimateData ? captureQuotePriceSnapshot(estimateData, ctx) : undefined;

  return {
    id: createLeadId("concierge"),
    source: "concierge",
    createdAt: new Date().toISOString(),
    name,
    phone,
    hot: isHotLead(session),
    summary: buildConciergeLeadSummary(session, ctx),
    photoCount,
    priceSnapshot,
    session: {
      id: session.id,
      stage: session.stage,
      quote: session.quote,
      turns: session.turns,
    },
  };
}

export function createContactStoredLead(
  data: { name: string; phone: string; email?: string; plz: string; service: string; message?: string },
  photoCount: number
): StoredLead {
  const summary = [
    `Service: ${data.service}`,
    `PLZ: ${data.plz}`,
    data.message ? `Nachricht: ${data.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: createLeadId("contact"),
    source: "contact" as LeadSource,
    createdAt: new Date().toISOString(),
    name: data.name,
    phone: data.phone,
    email: data.email,
    summary,
    photoCount,
  };
}
