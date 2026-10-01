/**
 * Büroreinigung commercial calculator — domain layer.
 * Isolated from Fensterreinigung (lib/pricing.ts). Do not import Fenster engines.
 *
 * Money: integer euro-cents only. Never store float euros in domain results.
 */

export type EuroCents = number & { readonly __brand: "EuroCents" };

export function cents(n: number): EuroCents {
  if (!Number.isFinite(n)) {
    throw new RangeError("cents: non-finite");
  }
  return Math.round(n) as EuroCents;
}

export function eurosToCents(euros: number): EuroCents {
  if (!Number.isFinite(euros)) {
    throw new RangeError("eurosToCents: non-finite");
  }
  return Math.round(euros * 100) as EuroCents;
}

export function centsToEuros(c: EuroCents | number): number {
  return c / 100;
}

/** Decimal-safe percent of cents (e.g. VAT 19 → rateBps 1900). */
export function percentOfCents(amount: EuroCents | number, rateBps: number): EuroCents {
  return cents(Math.round((amount * rateBps) / 10_000));
}

export function addCents(...parts: Array<EuroCents | number>): EuroCents {
  return cents(parts.reduce((s, p) => s + p, 0));
}

export function formatEuroFromCents(c: EuroCents | number, locale = "de-DE"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(centsToEuros(c));
}
