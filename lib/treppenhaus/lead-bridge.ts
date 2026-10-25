import type { StoredLead } from "@/lib/leads-store";
import { createLeadId } from "@/lib/leads-store";
import { formatEuroFromCents } from "@/lib/treppenhaus/pricing";
import type { TreppenhausQuoteSnapshot } from "@/lib/treppenhaus/snapshot";

const TURNUS_LABEL = {
  weekly: "Wöchentlich",
  biweekly: "Alle 14 Tage",
  monthly: "Monatlich",
} as const;

const DIRT_LABEL = {
  normal: "Normal",
  medium: "Erhöht",
  heavy: "Stark",
} as const;

export function createTreppenhausStoredLead(snapshot: TreppenhausQuoteSnapshot): StoredLead {
  const { contact, input, quote, quoteReference } = snapshot;
  const summary = [
    "Service: Treppenhausreinigung",
    `Stockwerke: ${input.stockwerke}`,
    `Wohnungen: ${input.wohnungen}`,
    `Turnus: ${TURNUS_LABEL[input.stairTurnus]}`,
    `Verschmutzung: ${DIRT_LABEL[input.dirtLevel]}`,
    input.keller
      ? `Keller: ja (${TURNUS_LABEL[input.kellerTurnus]})`
      : "Keller: nein",
    input.aufzug ? "Aufzug: ja" : "",
    input.glasHandlauf ? "Glas/Handlauf: ja" : "",
    quote.needsInspection ? "Hinweis: Besichtigung empfohlen" : "",
    `Orientierung netto/Monat: ${formatEuroFromCents(quote.monthlyNetCents)}`,
    `Orientierung brutto/Monat: ${formatEuroFromCents(quote.monthlyGrossCents)}`,
    contact.street ? `Straße: ${contact.street}` : "",
    contact.notes ? `Notiz: ${contact.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const nameParts = contact.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? contact.name;
  const lastName = nameParts.slice(1).join(" ");

  return {
    id: createLeadId("quote"),
    source: "quote",
    serviceLine: "treppenhaus",
    createdAt: snapshot.capturedAt,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    anfrageNr: quoteReference,
    status: "neu",
    summary,
    photoCount: 0,
    treppenhausSnapshot: snapshot,
    quote: {
      firstName,
      lastName,
      email: contact.email,
      phone: contact.phone,
      postalCode: contact.postalCode,
      city: contact.city,
      street: contact.street ?? "",
      privacyAccepted: contact.privacyAccepted,
    },
  };
}
