/**
 * Proactive / exit-intent playbooks — page-aware sales CTAs (Termin / Rückruf).
 */
import { routes } from "@/lib/routes";
import { siteConfig } from "@/lib/config";
import type { ConciergeSession } from "./types";
import { hasTransferableQuoteData } from "./wizard-bridge";
import { isHotLead } from "./lead";

export type PlaybookPage =
  | "home"
  | "angebot"
  | "fenster"
  | "buero"
  | "treppenhaus"
  | "gutschein"
  | "other";

export function resolvePlaybookPage(pathname: string): PlaybookPage {
  if (pathname === routes.home || pathname === "/") return "home";
  if (pathname.startsWith(routes.angebot)) return "angebot";
  if (pathname.startsWith(routes.bueroreinigung)) return "buero";
  if (pathname.startsWith(routes.treppenhausreinigung)) return "treppenhaus";
  if (pathname.includes("gutschein")) return "gutschein";
  if (pathname.startsWith(routes.fensterreinigung)) return "fenster";
  return "other";
}

export type PlaybookCopy = {
  nudge: string;
  exit: string;
  quickReplies: string[];
};

export function buildPlaybookCopy(
  pathname: string,
  session?: ConciergeSession
): PlaybookCopy {
  const page = resolvePlaybookPage(pathname);
  const hot = session ? isHotLead(session) : false;
  const hasData = session ? hasTransferableQuoteData(session) : false;

  if (hot || hasData) {
    return {
      nudge: hot
        ? "Ihre Orientierung steht — jetzt Rückruf oder Termin sichern?"
        : "Ihre Angaben sind notiert — ich rechne weiter oder sichere den Rückruf.",
      exit: hasData
        ? "Ihre Angaben sind gespeichert – im Preisrechner übernehmen wir sie automatisch. Noch eine Frage oder Rückruf?"
        : "Noch einen Moment: Mit Name und Telefon bekommen Sie Festpreis und Terminvorschlag.",
      quickReplies: ["Rückruf jetzt", "Termin vorschlagen", "Anrufen"],
    };
  }

  switch (page) {
    case "angebot":
      return {
        nudge: "Hilfe bei Flügel & Etage? Ich rechne live — oder sichern Sie direkt einen Rückruf.",
        exit: hasData
          ? "Ihre Angaben sind notiert. Noch unsicher? Ich erkläre den Preis oder hole einen Rückruf."
          : "Noch unsicher bei der Kalkulation? Ich erkläre Flügel, Etage und Live-Preis.",
        quickReplies: ["Preis erklären", "Rückruf", "Termin"],
      };
    case "buero":
      return {
        nudge: "Büro-Orientierung in 2 Angaben (m² + Turnus) — danach Festpreis-Rückruf.",
        exit: "Bevor Sie gehen: Büro-m² nennen — ich gebe eine Orientierung und sichere den Rückruf.",
        quickReplies: ["80 m²", "120 m²", "Rückruf"],
      };
    case "treppenhaus":
      return {
        nudge: "Treppenhaus: Stockwerke + Wohnungen — ich rechne mit dem echten Motor.",
        exit: "Kurz Treppenhaus-Daten nennen? Dann Orientierung und Terminwunsch.",
        quickReplies: ["4 Stockwerke", "Keller dabei?", "Rückruf"],
      };
    case "fenster":
      return {
        nudge: "Fensterreinigung: Flügelzahl nennen — Live-Orientierung in Sekunden.",
        exit: "Noch Fragen zu Preis oder Termin? Ich helfe sofort oder hole den Rückruf.",
        quickReplies: ["10 Flügel", "Termin", "Rückruf"],
      };
    case "gutschein":
      return {
        nudge: "Gutschein verschenken? Ich leite Sie zum Bestellfluss — oder Rückruf.",
        exit: "Gutschein noch offen? Fragen Sie mich oder rufen Sie direkt an.",
        quickReplies: ["Gutschein öffnen", "Anrufen", "Rückruf"],
      };
    case "home":
      return {
        nudge: `Live-Orientierung in 1 Minute — Fenster, Büro oder Treppenhaus in ${siteConfig.contact.region}.`,
        exit: `Bevor Sie gehen: Live-Preisschätzung in unter 2 Minuten – ich helfe bei Fensterreinigung in ${siteConfig.contact.region}.`,
        quickReplies: ["Fensterpreis", "Büro", "Rückruf"],
      };
    default:
      return {
        nudge: `Fragen zu Reinigung in ${siteConfig.contact.region}? Preis, Termin oder Rückruf — ich helfe.`,
        exit: "Kurz stehen bleiben? Ich kläre Preis oder hole einen Rückruf.",
        quickReplies: ["Leistungen", "Rückruf", "Anrufen"],
      };
  }
}
