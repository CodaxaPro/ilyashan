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
    text: "Einen verbindlichen Preis nenne ich nicht aus dem Chat. Bitte nutzen Sie den passenden Preisrechner oder fordern Sie ein Festpreis-Angebot nach Prüfung an — ich helfe Ihnen zum richtigen Formular.",
    blockedInventedPrice: true,
  };
}
