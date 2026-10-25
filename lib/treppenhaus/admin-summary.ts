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

/** Admin lead detail rows for Treppenhaus quote leads. */
export function buildTreppenhausAdminRows(
  snap: TreppenhausQuoteSnapshot
): [string, string][] {
  const { input, quote, contact } = snap;
  return [
    ["Anfrage-Nr.", snap.quoteReference],
    ["Leistung", "Treppenhausreinigung"],
    ["Name", contact.name],
    ["Ort", `${contact.postalCode} ${contact.city}`.trim()],
    ...(contact.street ? ([["Straße", contact.street]] as [string, string][]) : []),
    ["Stockwerke", String(input.stockwerke)],
    ["Wohnungen", String(input.wohnungen)],
    ["Turnus", TURNUS_LABEL[input.stairTurnus]],
    ["Verschmutzung", DIRT_LABEL[input.dirtLevel]],
    ["Keller", input.keller ? TURNUS_LABEL[input.kellerTurnus] : "Nein"],
    ["Aufzug", input.aufzug ? "Ja" : "Nein"],
    ["Glas/Handlauf", input.glasHandlauf ? "Ja" : "Nein"],
    ["Orientierung netto/Monat", formatEuroFromCents(quote.monthlyNetCents)],
    ["Orientierung brutto/Monat", formatEuroFromCents(quote.monthlyGrossCents)],
    ...(quote.needsInspection
      ? ([["Hinweis", "Besichtigung empfohlen"]] as [string, string][])
      : []),
    ...(contact.notes ? ([["Notiz", contact.notes]] as [string, string][]) : []),
  ];
}

export function treppenhausEstimateLabel(snap: TreppenhausQuoteSnapshot): string {
  return `${formatEuroFromCents(snap.quote.monthlyGrossCents)} brutto / Monat (Orientierung)`;
}
