/**
 * Full service catalog for sales agent — every product has a close path.
 */
import { phoneAction } from "@/lib/concierge/knowledge";
import type { AssistantProduct, ConciergeAction, ConciergeSession } from "@/lib/concierge/types";
import { siteConfig } from "@/lib/config";
import { calculatorHrefFor } from "../policy";

export const ALL_SALES_PRODUCTS: AssistantProduct[] = [
  "fenster",
  "buero",
  "treppenhaus",
  "praxis",
  "bauend",
  "renovierung",
  "entruempelung",
  "gutschein",
];

const LABELS: Record<AssistantProduct, string> = {
  fenster: "Fensterreinigung",
  buero: "Büroreinigung",
  treppenhaus: "Treppenhausreinigung",
  praxis: "Praxisreinigung",
  bauend: "Bauendreinigung",
  renovierung: "Renovierungsreinigung",
  entruempelung: "Entrümpelung",
  gutschein: "Gutschein",
};

function link(label: string, href: string): ConciergeAction {
  return { type: "link", label, href };
}

export function openServiceCase(
  session: ConciergeSession,
  product: AssistantProduct
): {
  session: ConciergeSession;
  text: string;
  actions: ConciergeAction[];
  quickReplies: string[];
} {
  const next: ConciergeSession = {
    ...session,
    assistantProduct: product,
    turns: session.turns + 1,
    lastIntent: "price",
    stage: product === "gutschein" ? "idle" : "idle",
  };

  const href = calculatorHrefFor(product);
  const actions: ConciergeAction[] = [];
  if (href) {
    actions.push(
      link(
        product === "gutschein" ? "Gutschein öffnen" : "Online-Formular öffnen",
        href
      )
    );
  }
  actions.push(phoneAction());

  if (product === "fenster") {
    return {
      session: next,
      text: `Gerne — **Fensterreinigung**. Wie viele **Flügel** sind es, und in welchem **Stockwerk** (EG, 1. OG, …)? Dann rechne ich die Orientierung live.`,
      actions,
      quickReplies: ["12 Flügel EG", "20 Flügel 1. OG", "Festpreis anfragen"],
    };
  }

  if (product === "treppenhaus") {
    return {
      session: next,
      text: `Gerne — **Treppenhausreinigung**. **Wie viele Stockwerke** hat das Haus (EG mitgezählt)?`,
      actions,
      quickReplies: ["3 Stockwerke", "4 Stockwerke", "5 Stockwerke"],
    };
  }

  if (product === "buero") {
    return {
      session: next,
      text: `Gerne — **Büroreinigung**. Wie groß ist die Fläche ungefähr (**m²**), und wie oft soll gereinigt werden (z. B. 1× / 2× pro Woche)?`,
      actions,
      quickReplies: ["120 m² 1× Woche", "200 m² 2× Woche", "Festpreis anfragen"],
    };
  }

  if (product === "gutschein") {
    return {
      session: next,
      text: `Gerne — unsere **Gutscheine** für Fensterreinigung. Ich kann Ihnen den Shop öffnen oder Ihre Daten für eine persönliche Beratung aufnehmen.`,
      actions: [link("Gutschein bestellen", "/de/gutschein"), phoneAction()],
      quickReplies: ["Gutschein öffnen", "Rückruf", "Andere Leistung"],
    };
  }

  // Manual Festpreis products — never invent €; close via lead
  const ask: Record<
    Exclude<AssistantProduct, "fenster" | "buero" | "treppenhaus" | "gutschein">,
    string
  > = {
    praxis: `Gerne **Praxisreinigung**. Kurz: Welche Räume/Fläche, wie oft, und wo (PLZ)? Online gibt es keinen Sofortpreis — ich nehme Ihre Angaben fürs **Festpreis-Angebot** (ca. ${siteConfig.business.responseTime}).`,
    bauend: `Gerne **Bauendreinigung**. Kurz: Objektart, ungefähre m², Übergabetermin, PLZ? Dann erstelle ich die Anfrage fürs Festpreis-Angebot.`,
    renovierung: `Gerne **Renovierungsreinigung**. Was wurde renoviert, ungefähre m² und gewünschter Termin? Ich sichere die Anfrage fürs Festpreis-Angebot.`,
    entruempelung: `Gerne **Entrümpelung**. Welche Räume/Umfang und PLZ? Ich nehme die Anfrage auf — Festpreis nach kurzer Klärung.`,
  };

  return {
    session: { ...next, stage: "price_ready" }, // allow lead form immediately for Festpreis path
    text: `${ask[product]}\n\nWenn Sie möchten: **Name und Telefon** — ich leite alles an unser Team weiter.`,
    actions,
    quickReplies: ["Rückruf / Festpreis", "Mehr Details nennen", "Andere Leistung"],
  };
}

export function productLabel(product: AssistantProduct): string {
  return LABELS[product];
}
