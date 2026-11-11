/**
 * Live-Preis-Politik für den Angebots-Wizard.
 *
 * Regel (Produkt): Jeder berechnet denselben Privat-Preis (Flügel, inkl. MwSt.).
 * Gewerbe bleibt als Leistungs-/Objekt-Label erhalten, ändert aber nicht die Formel.
 * Große / breite Scheiben → keine Live-Zahl, individuelle Anfrage.
 */

import type { QuoteFormData, WindowSizeOption } from "@/lib/quote-form";

export type { WindowSizeOption };

export const windowSizeLabels: Record<WindowSizeOption, string> = {
  standard: "Standard",
  large: "Größer als normal",
};

export const windowSizeHints: Record<WindowSizeOption, string> = {
  standard: "Normale Wohnungs- / Bürofenster",
  large: "Große oder breite Scheiben · Schaufenster",
};

/** Live-Kalkulation immer Privat – unabhängig von Leistung/Objekt. */
export function usesPrivatLivePricing(): boolean {
  return true;
}

export function isLargeWindowQuote(
  data: Pick<Partial<QuoteFormData>, "windowSize"> | null | undefined
): boolean {
  return data?.windowSize === "large";
}

export function shouldCalculateLivePrice(
  data: Pick<Partial<QuoteFormData>, "windowSize"> | null | undefined
): boolean {
  return !isLargeWindowQuote(data);
}

export const LARGE_WINDOW_PRICE_LABEL =
  "Individuell auf Anfrage (große / breite Scheiben)";

export const LARGE_WINDOW_PRICE_NOTE =
  "Kein Live-Preis. Unten Angaben machen, am Ende Foto hochladen und Anfrage absenden — Rückmeldung in 24 Std.";
