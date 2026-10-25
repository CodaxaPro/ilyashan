import type { TreppenhausInput, TreppenhausQuote } from "@/lib/treppenhaus/pricing";
import { calculateTreppenhausQuote } from "@/lib/treppenhaus/pricing";

export type TreppenhausContact = {
  name: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  street?: string;
  notes?: string;
  privacyAccepted: boolean;
};

export type TreppenhausQuoteSnapshot = {
  quoteReference: string;
  capturedAt: string;
  input: TreppenhausInput;
  quote: TreppenhausQuote;
  contact: TreppenhausContact;
};

export function generateTreppenhausQuoteReference(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TRP-${y}${m}${day}-${rand}`;
}

/** Server-side recalc — never trust client price fields. */
export function buildTreppenhausSnapshot(
  input: TreppenhausInput,
  contact: TreppenhausContact,
  quoteReference = generateTreppenhausQuoteReference()
): TreppenhausQuoteSnapshot {
  return {
    quoteReference,
    capturedAt: new Date().toISOString(),
    input,
    quote: calculateTreppenhausQuote(input),
    contact,
  };
}
