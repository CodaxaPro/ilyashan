import type { ConciergeSession } from "@/lib/concierge/types";
import { buildLeadSummaryRows } from "@/lib/concierge/lead";
import type { QuoteFormData } from "@/lib/quote-form";
import { buildQuotePlainText } from "@/lib/quote-summary";
import type { LeadSource, StoredLead } from "@/lib/leads-store";
import { createLeadId } from "@/lib/leads-store";
import { isHotLead } from "@/lib/concierge/lead";
import { getQuoteContactName } from "@/lib/quote-summary";

export function buildConciergeLeadSummary(session: ConciergeSession): string {
  return buildLeadSummaryRows(session)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function createQuoteStoredLead(
  quote: QuoteFormData,
  anfrageNr: string,
  photoCount: number
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
    summary: buildQuotePlainText(quote, anfrageNr),
    photoCount,
    quote,
  };
}

export function createConciergeStoredLead(
  session: ConciergeSession,
  name: string,
  phone: string,
  photoCount: number
): StoredLead {
  return {
    id: createLeadId("concierge"),
    source: "concierge",
    createdAt: new Date().toISOString(),
    name,
    phone,
    hot: isHotLead(session),
    summary: buildConciergeLeadSummary(session),
    photoCount,
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
