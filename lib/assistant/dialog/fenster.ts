/**
 * Structured Fenster fields from AI → same estimate engine as classic concierge.
 */
import { phoneAction } from "@/lib/concierge/knowledge";
import { extractFloorLevel, extractWindowCount } from "@/lib/concierge/extract";
import type { ConciergeAction, ConciergeSession } from "@/lib/concierge/types";
import type { CleaningSide, DirtLevel, FloorLevel, QuoteServiceId } from "@/lib/quote-form";
import { routes } from "@/lib/routes";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import { defaultQuotePricingContext } from "@/lib/quote-pricing-context";
import { priceFenster } from "../tools/price";

export type FensterStructuredPatch = {
  windowCount?: number;
  floorLevel?: FloorLevel;
  dirtLevel?: DirtLevel;
  cleaningSide?: CleaningSide;
  services?: QuoteServiceId[];
  postalCode?: string;
  city?: string;
};

export type FensterDialogResult = {
  session: ConciergeSession;
  text: string;
  actions: ConciergeAction[];
  quickReplies: string[];
  emittedEuro: boolean;
  complete: boolean;
};

function link(label: string, href: string): ConciergeAction {
  return { type: "link", label, href };
}

export function applyFensterStructuredFields(
  session: ConciergeSession,
  patch: FensterStructuredPatch,
  pricingCtx: QuotePricingContext = defaultQuotePricingContext()
): FensterDialogResult {
  const quote = { ...session.quote };
  if (typeof patch.windowCount === "number" && patch.windowCount >= 1 && patch.windowCount <= 200) {
    quote.windowCount = Math.round(patch.windowCount);
  }
  if (patch.floorLevel) quote.floorLevel = patch.floorLevel;
  if (patch.dirtLevel) quote.dirtLevel = patch.dirtLevel;
  if (patch.cleaningSide) quote.cleaningSide = patch.cleaningSide;
  if (patch.services?.length) quote.services = patch.services;
  if (patch.postalCode) quote.postalCode = patch.postalCode;
  if (patch.city) quote.city = patch.city;

  const nextSession: ConciergeSession = {
    ...session,
    assistantProduct: "fenster",
    quote,
    turns: session.turns + 1,
    lastIntent: "price",
  };

  const priced = priceFenster(quote, pricingCtx);
  if (priced.ok) {
    nextSession.stage = "price_ready";
    return {
      session: nextSession,
      text: [
        priced.data.labelDe,
        ``,
        `**Nächster Schritt:** Name und Telefon — dann erstellen wir Ihr Festpreis-Angebot und einen Terminvorschlag.`,
      ].join("\n"),
      actions: [
        link("Im Preisrechner öffnen", routes.angebot),
        phoneAction(),
      ],
      quickReplies: ["Festpreis anfragen", "Mehr Flügel", "Andere Leistung"],
      emittedEuro: true,
      complete: true,
    };
  }

  nextSession.stage = "idle";
  const missing = priced.ok === false ? priced.missingFields ?? [] : [];
  let ask = "Für die Fenster-Orientierung brauche ich kurz **Anzahl der Flügel** und die **Etage** (z. B. EG, 1. OG).";
  if (missing.includes("windowCount") && !missing.includes("floorLevel")) {
    ask = "Wie viele **Fensterflügel** sind es ungefähr?";
  } else if (missing.includes("floorLevel") && !missing.includes("windowCount")) {
    ask = `Notiert: **${quote.windowCount} Flügel**. In welchem **Stockwerk** liegen die Fenster? (EG, 1. OG, …)`;
  }

  return {
    session: nextSession,
    text: ask,
    actions: [phoneAction()],
    quickReplies: ["12 Flügel", "EG", "1. OG", "2. OG"],
    emittedEuro: false,
    complete: false,
  };
}

/** Deterministic turn: extract Flügel/Etage from free text, then same engine as tools. */
export function advanceFensterDialog(
  session: ConciergeSession,
  message: string,
  pricingCtx: QuotePricingContext = defaultQuotePricingContext()
): FensterDialogResult {
  const patch: FensterStructuredPatch = {};
  const windows = extractWindowCount(message);
  if (windows) patch.windowCount = windows;
  const floor = extractFloorLevel(message);
  if (floor) patch.floorLevel = floor;
  return applyFensterStructuredFields(session, patch, pricingCtx);
}

export function shouldHandleFensterDialog(session: ConciergeSession, message: string): boolean {
  if (session.assistantProduct === "fenster") return true;
  if (session.quote.windowCount && session.quote.windowCount >= 1 && !session.quote.floorLevel) {
    return true;
  }
  if (extractWindowCount(message) || extractFloorLevel(message)) return true;
  return /fenster|flügel|fluegel|glasreinigung/i.test(message);
}
