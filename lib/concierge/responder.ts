import type { ConciergeIntent, ConciergeReply, ConciergeSession } from "./types";
import { CONCIERGE_QUICK_REPLIES, createSession } from "./types";
import { classifyIntent, findFaqAnswer } from "./intent";
import { isOutOfScope, OUT_OF_SCOPE_REPLY } from "./scope";
import {
  extractWindowCount,
  extractFloorLevel,
  extractPostalCode,
  extractCityHint,
} from "./extract";
import {
  buildGreeting,
  buildServicesOverview,
  buildAreaInfo,
  buildProcessInfo,
  buildFestpreisInfo,
  buildInsuranceInfo,
  buildWinterInfo,
  buildAppointmentInfo,
  buildContactInfo,
  buildFluegelGuide,
  buildThanks,
  buildUnknown,
  wizardAction,
  phoneAction,
  whatsappAction,
  whatsappActionFromSession,
} from "./knowledge";
import {
  mergeQuoteFromMessage,
  resolveStage,
} from "./session";
import {
  buildPriceResponse,
  missingPriceFields,
  askForMissingFields,
} from "./pricing-response";
import { siteConfig } from "@/lib/config";

function defaultQuickReplies(): string[] {
  return [...CONCIERGE_QUICK_REPLIES];
}

function withWizard(actions: ConciergeReply["actions"]): ConciergeReply["actions"] {
  if (actions.some((a) => a.href.includes("/angebot"))) return actions;
  return [wizardAction(), ...actions];
}

function serviceDetailReply(message: string): string {
  const lower = message.toLowerCase();
  const service = siteConfig.services.find((s) => lower.includes(s.id) || lower.includes(s.title.toLowerCase().slice(0, 6)));
  if (!service) return buildServicesOverview();
  return `**${service.title}**

${service.description}

Richtwert: **${service.priceFrom}** (inkl. MwSt., ${siteConfig.contact.region})

Für Ihren genauen Preis nutzen Sie unseren Live-Preisrechner – Flügel, Etage und Extras werden transparent kalkuliert.`;
}

function handlePriceFlow(
  session: ConciergeSession,
  message: string,
  intent: ConciergeIntent
): ConciergeReply {
  const updated = mergeQuoteFromMessage(session, message);
  const missing = missingPriceFields(updated.quote);

  if (missing.length === 0) {
    const priceText = buildPriceResponse(updated.quote);
    if (priceText) {
      return {
        text: priceText,
        intent: intent === "price_collect" ? "price_collect" : "price",
        session: { ...updated, stage: "price_ready", lastIntent: "price" },
        actions: withWizard([wizardAction(), whatsappActionFromSession({ ...updated, stage: "price_ready" }), phoneAction()]),
        quickReplies: ["Rückruf anfordern", "Verbindliches Angebot anfordern", "Einsatzgebiet"],
      };
    }
  }

  const stage = resolveStage(missing);
  return {
    text: askForMissingFields(missing),
    intent: "price_collect",
    session: { ...updated, stage, lastIntent: "price" },
    actions: [wizardAction()],
    quickReplies: ["Wie zähle ich Flügel?", "10 Flügel, 2. OG", "Was kostet eine Wohnung?"],
  };
}

export function processConciergeMessage(
  message: string,
  sessionInput?: ConciergeSession
): ConciergeReply {
  const session = sessionInput ?? createSession();
  const trimmed = message.trim();

  if (!trimmed) {
    return {
      text: buildUnknown(),
      intent: "unknown",
      session,
      actions: [wizardAction()],
      quickReplies: defaultQuickReplies(),
    };
  }

  if (isOutOfScope(trimmed)) {
    return {
      text: OUT_OF_SCOPE_REPLY,
      intent: "out_of_scope",
      session: { ...session, turns: session.turns + 1, lastIntent: "out_of_scope" },
      actions: [wizardAction()],
      quickReplies: defaultQuickReplies(),
    };
  }

  let intent = classifyIntent(trimmed);

  if (
    session.stage.startsWith("price") ||
    (intent === "unknown" && (extractWindowCount(trimmed) || extractFloorLevel(trimmed)))
  ) {
    intent = "price_collect";
  }

  if (intent === "price" || intent === "price_collect") {
    return handlePriceFlow(
      { ...session, turns: session.turns + 1 },
      trimmed,
      intent
    );
  }

  const baseSession: ConciergeSession = {
    ...session,
    turns: session.turns + 1,
    lastIntent: intent,
    stage: "idle",
  };

  switch (intent) {
    case "greeting":
      return {
        text: buildGreeting(),
        intent,
        session: baseSession,
        actions: [wizardAction(), phoneAction()],
        quickReplies: defaultQuickReplies(),
      };

    case "thanks":
      return {
        text: buildThanks(),
        intent,
        session: baseSession,
        actions: [wizardAction()],
        quickReplies: ["Preis berechnen", "Kontakt"],
      };

    case "services":
      return {
        text: buildServicesOverview(),
        intent,
        session: baseSession,
        actions: withWizard([whatsappAction()]),
        quickReplies: ["Was kostet Privat?", "Gewerbe", "Preisrechner starten"],
      };

    case "service_detail":
      return {
        text: serviceDetailReply(trimmed),
        intent,
        session: baseSession,
        actions: withWizard([]),
        quickReplies: ["Alle Leistungen", "Preis berechnen"],
      };

    case "area": {
      const plz = extractPostalCode(trimmed);
      const city = extractCityHint(trimmed);
      let text = buildAreaInfo();
      if (plz || city) {
        text += `\n\n_Ihre Angabe (${plz ?? city}) liegt in unserem Einsatzgebiet – kein Anfahrtszuschlag._`;
      }
      return {
        text,
        intent,
        session: baseSession,
        actions: [wizardAction(), phoneAction()],
        quickReplies: ["Preis berechnen", "Termin"],
      };
    }

    case "process":
      return {
        text: buildProcessInfo(),
        intent,
        session: baseSession,
        actions: [wizardAction()],
        quickReplies: ["Festpreis vs. Schätzung?", "Jetzt starten"],
      };

    case "festpreis_info":
      return {
        text: buildFestpreisInfo(),
        intent,
        session: baseSession,
        actions: [wizardAction()],
        quickReplies: ["Preis berechnen", "Wie schnell Antwort?"],
      };

    case "insurance":
      return {
        text: buildInsuranceInfo(),
        intent,
        session: baseSession,
        actions: [wizardAction()],
        quickReplies: defaultQuickReplies(),
      };

    case "winter":
      return {
        text: buildWinterInfo(),
        intent,
        session: baseSession,
        actions: [wizardAction(), phoneAction()],
        quickReplies: ["Preis berechnen", "Termin"],
      };

    case "appointment":
      return {
        text: buildAppointmentInfo(),
        intent,
        session: baseSession,
        actions: [phoneAction(), wizardAction(), whatsappAction()],
        quickReplies: ["Preis berechnen", "Rückruf"],
      };

    case "callback":
      return {
        text: `Sehr gerne! Hinterlassen Sie unten **Name und Telefonnummer** – wir rufen Sie innerhalb von **${siteConfig.business.responseTime}** zurück.\n\nOder rufen Sie direkt an: **${siteConfig.contact.phoneDisplay}**`,
        intent,
        session: baseSession,
        actions: [phoneAction(), whatsappActionFromSession(baseSession), wizardAction()],
        quickReplies: ["Rückruf anfordern", "Preisrechner"],
      };

    case "contact":
      return {
        text: buildContactInfo(),
        intent,
        session: baseSession,
        actions: [phoneAction(), whatsappAction(), wizardAction()],
        quickReplies: ["Preis berechnen"],
      };

    case "wizard":
      return {
        text: `Unser **5-Schritte Preisrechner** führt Sie in unter 2 Minuten zur Live-Preisschätzung:\n\n${siteConfig.messaging.angebotIntro}\n\nKlicken Sie unten auf **„${siteConfig.messaging.ctaPrimary}"** – oder stellen Sie mir hier Ihre Fragen.`,
        intent,
        session: baseSession,
        actions: [wizardAction()],
        quickReplies: ["Was kostet 10 Flügel?", "Leistungen"],
      };

    case "fluegel_help":
      return {
        text: buildFluegelGuide(),
        intent,
        session: baseSession,
        actions: [wizardAction()],
        quickReplies: ["12 Flügel, 2. OG", "Preis berechnen"],
      };

    case "faq_match": {
      const answer = findFaqAnswer(trimmed);
      return {
        text: answer
          ? `${answer}${answer.includes("Wizard") ? "" : `\n\n_Möchten Sie Ihre persönliche Live-Preisschätzung? Ich rechne gern für Sie._`}`
          : buildUnknown(),
        intent,
        session: baseSession,
        actions: [wizardAction()],
        quickReplies: defaultQuickReplies(),
      };
    }

    default: {
      const faq = findFaqAnswer(trimmed);
      if (faq) {
        return {
          text: faq,
          intent: "faq_match",
          session: { ...baseSession, lastIntent: "faq_match" },
          actions: [wizardAction()],
          quickReplies: defaultQuickReplies(),
        };
      }
      return {
        text: buildUnknown(),
        intent: "unknown",
        session: baseSession,
        actions: [wizardAction(), phoneAction()],
        quickReplies: defaultQuickReplies(),
      };
    }
  }
}

export { createSession, CONCIERGE_QUICK_REPLIES };
export type { ConciergeSession, ConciergeReply, ConciergeIntent };
