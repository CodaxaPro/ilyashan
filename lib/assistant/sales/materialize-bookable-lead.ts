/**
 * Fail-closed: chat session → quote-source StoredLead with real engine snapshots.
 * Calendar sync only accepts source === "quote" + product payload.
 */
import { buildBueroInputFromDraft } from "@/lib/assistant/dialog/buero";
import {
  getTreppenhausDraft,
  isTreppenhausComplete,
} from "@/lib/assistant/dialog/treppenhaus";
import { buildConciergeLeadSummary } from "@/lib/lead-records";
import type { ConciergeSession } from "@/lib/concierge/types";
import { calculateOfficeCleaningQuote } from "@/lib/cleaning/calculate";
import { DEFAULT_CLEANING_CONFIG } from "@/lib/cleaning/seed-config";
import {
  buildCleaningQuoteSnapshot,
  generateCleaningQuoteReference,
} from "@/lib/cleaning/snapshot";
import { createLeadId, type StoredLead } from "@/lib/leads-store";
import { initialQuoteFormData } from "@/lib/quote-form";
import {
  captureQuotePriceSnapshot,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import { quoteDataForEstimate } from "@/lib/concierge/pricing-response";
import {
  buildTreppenhausSnapshot,
  generateTreppenhausQuoteReference,
} from "@/lib/treppenhaus/snapshot";
import { canCustomerBookOnline } from "@/lib/lead-product";

export type MaterializeResult =
  | { ok: true; lead: StoredLead }
  | { ok: false; code: string; messageDe: string; missing?: string[] };

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? name.trim(),
    lastName: parts.slice(1).join(" "),
  };
}

function contactQuoteFields(name: string, phone: string, session: ConciergeSession) {
  const { firstName, lastName } = splitName(name);
  return {
    firstName,
    lastName,
    phone,
    email: session.quote.email ?? "",
    postalCode: session.quote.postalCode ?? "",
    city: session.quote.city ?? "",
    street: session.quote.street ?? "",
    privacyAccepted: true,
  };
}

function materializeFenster(
  session: ConciergeSession,
  name: string,
  phone: string,
  ctx?: QuotePricingContext
): MaterializeResult {
  const windowCount = session.quote.windowCount;
  if (!windowCount || windowCount < 1) {
    return {
      ok: false,
      code: "incomplete_fenster",
      messageDe:
        "Für die Terminbuchung brauche ich noch die Anzahl der Fensterflügel. Wie viele Flügel sollen gereinigt werden?",
      missing: ["windowCount"],
    };
  }

  const quote = {
    ...initialQuoteFormData,
    ...session.quote,
    ...contactQuoteFields(name, phone, session),
    windowCount,
  };
  const estimateData = ctx ? quoteDataForEstimate(quote) : null;
  const priceSnapshot =
    ctx && estimateData ? captureQuotePriceSnapshot(estimateData, ctx) : undefined;

  const lead: StoredLead = {
    id: createLeadId("quote"),
    source: "quote",
    serviceLine: "fenster",
    createdAt: new Date().toISOString(),
    name: name.trim(),
    phone: phone.trim(),
    email: quote.email || undefined,
    status: "neu",
    summary: [
      buildConciergeLeadSummary(session, ctx),
      "Kanal: Chat-Terminbuchung",
    ].join("\n"),
    photoCount: 0,
    priceSnapshot: priceSnapshot ?? undefined,
    quote,
    session: {
      id: session.id,
      stage: session.stage,
      assistantProduct: session.assistantProduct,
      quote: session.quote,
    },
    hot: true,
  };

  if (!canCustomerBookOnline(lead)) {
    return {
      ok: false,
      code: "not_bookable",
      messageDe: "Fenstereckdaten sind noch unvollständig für die Online-Buchung.",
    };
  }
  return { ok: true, lead };
}

function materializeBuero(
  session: ConciergeSession,
  name: string,
  phone: string
): MaterializeResult {
  const draft = session.bueroDraft;
  if (!draft?.totalAreaM2 || draft.totalAreaM2 < 20 || !draft.frequency) {
    const missing: string[] = [];
    if (!draft?.totalAreaM2 || draft.totalAreaM2 < 20) missing.push("totalAreaM2");
    if (!draft?.frequency) missing.push("frequency");
    return {
      ok: false,
      code: "incomplete_buero",
      messageDe:
        "Für die Terminbuchung brauche ich noch m² und Reinigungsturnus der Bürofläche.",
      missing,
    };
  }

  const input = buildBueroInputFromDraft(draft);
  const calc = calculateOfficeCleaningQuote(input, DEFAULT_CLEANING_CONFIG);
  const { firstName, lastName } = splitName(name);
  const contact = {
    company: session.quote.city
      ? `Büro ${session.quote.city}`
      : `Chat-Anfrage ${name.trim()}`,
    contactPerson: name.trim(),
    email: session.quote.email?.trim() || "",
    phone: phone.trim(),
    postalCode: session.quote.postalCode ?? "",
    city: session.quote.city ?? "",
    street: session.quote.street ?? "",
    notes: session.salesNotes ?? "",
    privacyNoticeAccepted: true,
  };
  const snapshot = buildCleaningQuoteSnapshot({
    quoteReference: generateCleaningQuoteReference(),
    input,
    contact,
    calc,
    config: DEFAULT_CLEANING_CONFIG,
  });

  const lead: StoredLead = {
    id: createLeadId("quote"),
    source: "quote",
    serviceLine: "buero",
    createdAt: snapshot.capturedAt,
    name: name.trim(),
    phone: phone.trim(),
    email: contact.email || undefined,
    anfrageNr: snapshot.quoteReference,
    status: "neu",
    summary: [
      "Service: Büroreinigung",
      `m²: ${draft.totalAreaM2}`,
      `Turnus: ${draft.frequency}`,
      "Kanal: Chat-Terminbuchung",
    ].join("\n"),
    photoCount: 0,
    cleaningSnapshot: snapshot,
    quote: {
      firstName,
      lastName,
      email: contact.email,
      phone: contact.phone,
      postalCode: contact.postalCode,
      city: contact.city,
      street: contact.street,
      privacyAccepted: true,
    },
    session: {
      id: session.id,
      assistantProduct: "buero",
      bueroDraft: draft,
    },
    hot: true,
  };

  if (!canCustomerBookOnline(lead)) {
    return {
      ok: false,
      code: "not_bookable",
      messageDe: "Bürodaten sind noch unvollständig für die Online-Buchung.",
    };
  }
  return { ok: true, lead };
}

function materializeTreppenhaus(
  session: ConciergeSession,
  name: string,
  phone: string
): MaterializeResult {
  const draft = getTreppenhausDraft(session);
  if (!isTreppenhausComplete(draft)) {
    return {
      ok: false,
      code: "incomplete_treppenhaus",
      messageDe:
        "Für die Terminbuchung brauche ich noch die Treppenhaus-Angaben (Stockwerke, Wohnungen, Turnus, Verschmutzung, Keller).",
      missing: ["treppenhaus"],
    };
  }

  const snapshot = buildTreppenhausSnapshot(draft, {
    name: name.trim(),
    email: session.quote.email ?? "",
    phone: phone.trim(),
    postalCode: session.quote.postalCode ?? "",
    city: session.quote.city ?? "",
    street: session.quote.street,
    notes: session.salesNotes,
    privacyAccepted: true,
  }, generateTreppenhausQuoteReference());

  const { firstName, lastName } = splitName(name);
  const lead: StoredLead = {
    id: createLeadId("quote"),
    source: "quote",
    serviceLine: "treppenhaus",
    createdAt: snapshot.capturedAt,
    name: name.trim(),
    phone: phone.trim(),
    email: snapshot.contact.email || undefined,
    anfrageNr: snapshot.quoteReference,
    status: "neu",
    summary: [
      "Service: Treppenhausreinigung",
      `Stockwerke: ${draft.stockwerke}`,
      `Wohnungen: ${draft.wohnungen}`,
      "Kanal: Chat-Terminbuchung",
    ].join("\n"),
    photoCount: 0,
    treppenhausSnapshot: snapshot,
    quote: {
      firstName,
      lastName,
      email: snapshot.contact.email,
      phone: snapshot.contact.phone,
      postalCode: snapshot.contact.postalCode,
      city: snapshot.contact.city,
      street: snapshot.contact.street ?? "",
      privacyAccepted: true,
    },
    session: {
      id: session.id,
      assistantProduct: "treppenhaus",
      treppenhausDraft: draft,
    },
    hot: true,
  };

  if (!canCustomerBookOnline(lead)) {
    return {
      ok: false,
      code: "not_bookable",
      messageDe: "Treppenhausdaten sind noch unvollständig für die Online-Buchung.",
    };
  }
  return { ok: true, lead };
}

/**
 * Builds a bookable quote lead from chat state. Fail-closed when product data incomplete.
 */
export function materializeBookableLeadFromSession(
  session: ConciergeSession,
  name: string,
  phone: string,
  ctx?: QuotePricingContext
): MaterializeResult {
  const product = session.assistantProduct;
  if (product === "buero" || session.bueroDraft?.totalAreaM2) {
    return materializeBuero(session, name, phone);
  }
  if (product === "treppenhaus" || session.treppenhausDraft) {
    return materializeTreppenhaus(session, name, phone);
  }
  if (product === "fenster" || Boolean(session.quote.windowCount) || !product) {
    return materializeFenster(session, name, phone, ctx);
  }

  // Manual products (praxis, bauend, …): no online schedule without engine payload
  return {
    ok: false,
    code: "manual_review_required",
    messageDe:
      "Für diese Leistung buchen wir den Termin nach kurzer Prüfung. Ich nehme Ihren Rückrufwunsch auf — Name und Telefon reichen, dann meldet sich das Team.",
  };
}
