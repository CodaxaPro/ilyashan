import { routes } from "@/lib/routes";
import type { AssistantProductLine, PriceDisclosure } from "./types";

/** Corporate customer wording — never claim Festpreis from an orientation engine. */
export const ORIENTIERUNG_DISCLAIMER_DE =
  "Das ist eine Orientierung, kein verbindlicher Festpreis. Den Festpreis nennen wir nach Prüfung — in der Regel innerhalb von 24 Stunden.";

export const MANUAL_PRICE_DISCLAIMER_DE =
  "Für diese Leistung gibt es keinen Online-Preis. Wir erfassen Ihre Angaben und nennen Ihnen den Festpreis nach Prüfung.";

export const CALCULATOR_REQUIRED_DISCLAIMER_DE =
  "Für eine verlässliche Orientierung brauchen wir die Angaben im Preisrechner — dort fließen alle Faktoren transparent ein.";

const DISCLOSURE: Record<AssistantProductLine, PriceDisclosure> = {
  fenster: "orientierung",
  buero: "calculator_required",
  treppenhaus: "calculator_required",
  praxis: "manual_festpreis_only",
  bauend: "manual_festpreis_only",
  renovierung: "manual_festpreis_only",
  entruempelung: "manual_festpreis_only",
  gutschein: "manual_festpreis_only",
  unknown: "manual_festpreis_only",
};

const CALCULATOR_HREF: Record<AssistantProductLine, string | null> = {
  fenster: routes.angebot,
  buero: routes.bueroreinigungAngebot,
  treppenhaus: routes.treppenhausreinigungAngebot,
  praxis: `${routes.praxisreinigung}#anfrage`,
  bauend: `${routes.bauendreinigung}#anfrage`,
  renovierung: `${routes.renovierungsreinigung}#anfrage`,
  entruempelung: `${routes.entruempelung}#anfrage`,
  gutschein: "/de/gutschein",
  unknown: null,
};

export function priceDisclosureFor(product: AssistantProductLine): PriceDisclosure {
  return DISCLOSURE[product];
}

export function calculatorHrefFor(product: AssistantProductLine): string | null {
  return CALCULATOR_HREF[product];
}

/**
 * Hard rule for free-text chat: only Fenster may emit € without a structured calculator payload.
 * Büro/Treppenhaus engines exist but Phase A chat never invents incomplete quotes.
 */
export function mayEmitEuroAmount(product: AssistantProductLine): boolean {
  return product === "fenster";
}
