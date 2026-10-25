import { phoneAction } from "@/lib/concierge/knowledge";
import type { ConciergeAction } from "@/lib/concierge/types";
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
    if (priced.calculatorHref) {
      actions.push(linkAction("Treppenhaus kalkulieren", priced.calculatorHref));
    }
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
    if (priced.calculatorHref) {
      actions.push(linkAction("Büro kalkulieren", priced.calculatorHref));
    }
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
    if (priced.calculatorHref) {
      actions.push(
        linkAction(
          product === "gutschein" ? "Gutschein ansehen" : "Anfrage senden",
          priced.calculatorHref
        )
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

  return {
    text: "Gerne helfe ich zu Fenster-, Büro-, Treppenhaus- und weiteren Reinigungen. Welche Leistung meinen Sie?",
    product: "unknown",
    actions: [phoneAction()],
    emittedEuro: false,
  };
}
