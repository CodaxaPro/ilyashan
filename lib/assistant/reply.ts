import { phoneAction } from "@/lib/concierge/knowledge";
import type { ConciergeAction } from "@/lib/concierge/types";
import { siteConfig } from "@/lib/config";
import { routes } from "@/lib/routes";
import { resolveProduct } from "./resolve-product";
import {
  priceBuero,
  priceFenster,
  priceManualService,
  priceTreppenhaus,
} from "./tools/price";
import type { QuoteFormData } from "@/lib/quote-form";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import { defaultQuotePricingContext } from "@/lib/quote-pricing-context";
import type { AssistantProductLine } from "./types";

export type AssistantCustomerReply = {
  text: string;
  product: AssistantProductLine;
  actions: ConciergeAction[];
  /** True when a euro amount was included (Fenster Orientierung only in Phase A). */
  emittedEuro: boolean;
};

function linkAction(label: string, href: string): ConciergeAction {
  return { type: "link", label, href };
}

/** Preisliste / fiyat listesi / general price ask without named service. */
export function isGeneralPriceListAsk(message: string): boolean {
  return /\b(preisliste|preis\s*liste|fiyat\s*list|tarife?|was\s+kostet|wie\s+teuer|preise?\b|kosten\b|orientierung)/i.test(
    message
  );
}

export function buildPriceListOverviewReply(): AssistantCustomerReply {
  return {
    product: "unknown",
    emittedEuro: false,
    text: `Gerne — eine feste PDF-Preisliste gibt es bei uns nicht, weil jedes Objekt anders ist. Wir rechnen **objektbezogen**:

• **Fenster** — Flügelanzahl + Höhe → Live-Orientierung, Festpreis nach Prüfung (meist in ${siteConfig.business.responseTime})
• **Treppenhaus** — Stockwerke, Wohnungen, Turnus → kann ich **hier im Chat** durchrechnen
• **Büro** — Fläche / Aufgaben → Online-Kalkulation
• **Praxis, Bauend, Renovierung, Entrümpelung** — kurze Anfrage, Festpreis nach Prüfung

Kein Anfahrtszuschlag in ${siteConfig.contact.region}. **Welche Leistung** soll ich Ihnen durchrechnen?`,
    actions: [
      linkAction("Fenster-Preisrechner", routes.angebot),
      linkAction("Büro kalkulieren", routes.bueroreinigungAngebot),
      linkAction("Treppenhaus kalkulieren", routes.treppenhausreinigungAngebot),
      phoneAction(),
    ],
  };
}

/**
 * Phase A customer reply from product resolution + price policy.
 * Does not mutate leads, WhatsApp, or calendar.
 */
export function buildAssistantPriceReply(
  message: string,
  fensterPartial?: Partial<QuoteFormData>,
  pricingCtx: QuotePricingContext = defaultQuotePricingContext()
): AssistantCustomerReply {
  const resolved = resolveProduct(message);
  if (!resolved.ok) {
    return {
      text: resolved.messageDe,
      product: "unknown",
      actions: [phoneAction()],
      emittedEuro: false,
    };
  }

  const { product, calculatorHref } = resolved.data;
  const actions: ConciergeAction[] = [];

  if (product === "fenster") {
    const priced = priceFenster(fensterPartial ?? {}, pricingCtx);
    if (priced.ok) {
      if (calculatorHref) {
        actions.push(linkAction("Im Preisrechner fortfahren", calculatorHref));
      }
      actions.push(phoneAction());
      return {
        text: priced.data.labelDe,
        product,
        actions,
        emittedEuro: true,
      };
    }
    if (priced.calculatorHref) {
      actions.push(linkAction("Preisrechner öffnen", priced.calculatorHref));
    }
    actions.push(phoneAction());
    return {
      text: priced.messageDe,
      product,
      actions,
      emittedEuro: false,
    };
  }

  if (product === "treppenhaus") {
    const priced = priceTreppenhaus(null);
    const href = !priced.ok ? priced.calculatorHref : calculatorHref;
    if (href) actions.push(linkAction("Treppenhaus kalkulieren", href));
    actions.push(phoneAction());
    return {
      text: priced.ok ? priced.data.labelDe : priced.messageDe,
      product,
      actions,
      emittedEuro: priced.ok,
    };
  }

  if (product === "buero") {
    const priced = priceBuero(null);
    const href = !priced.ok ? priced.calculatorHref : calculatorHref;
    if (href) actions.push(linkAction("Büro kalkulieren", href));
    actions.push(phoneAction());
    return {
      text: priced.ok ? priced.data.labelDe : priced.messageDe,
      product,
      actions,
      emittedEuro: priced.ok,
    };
  }

  if (
    product === "praxis" ||
    product === "bauend" ||
    product === "renovierung" ||
    product === "entruempelung" ||
    product === "gutschein"
  ) {
    const priced = priceManualService(product);
    const href = !priced.ok ? priced.calculatorHref : calculatorHref;
    if (href) {
      actions.push(
        linkAction(product === "gutschein" ? "Gutschein ansehen" : "Anfrage senden", href)
      );
    }
    actions.push(phoneAction());
    return {
      text: priced.ok ? priced.data.labelDe : priced.messageDe,
      product,
      actions,
      emittedEuro: false,
    };
  }

  if (isGeneralPriceListAsk(message)) {
    return buildPriceListOverviewReply();
  }

  return {
    text: "Gerne helfe ich zu Fenster-, Büro-, Treppenhaus- und weiteren Reinigungen. Welche Leistung meinen Sie?",
    product: "unknown",
    actions: [phoneAction()],
    emittedEuro: false,
  };
}
