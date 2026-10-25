/**
 * Hard guards — customer-facing text must not invent commercial prices.
 */

/** Matches common euro / price patterns in DE/TR copy. */
const EURO_OR_PRICE =
  /(?:\d{1,6}(?:[.,]\d{1,2})?\s*(?:€|eur(?:o)?))|(?:€\s*\d{1,6})|(?:\b\d{2,6}\s*euro\b)/i;

export function textContainsPriceClaim(text: string): boolean {
  return EURO_OR_PRICE.test(text);
}

/**
 * If the model wrote a price without an authorized tool emission, replace with safe copy.
 */
export function enforceNoInventedPrice(
  text: string,
  toolAuthorizedEuro: boolean
): { text: string; blockedInventedPrice: boolean } {
  if (toolAuthorizedEuro) {
    return { text, blockedInventedPrice: false };
  }
  if (!textContainsPriceClaim(text)) {
    return { text, blockedInventedPrice: false };
  }
  return {
    text: "Einen Euro-Betrag nenne ich nur, wenn unser Preismotor ihn berechnet hat. Sagen Sie mir kurz die Leistung (z. B. Treppenhaus oder Fenster) — ich frage die nötigen Angaben und rechne live.",
    blockedInventedPrice: true,
  };
}
