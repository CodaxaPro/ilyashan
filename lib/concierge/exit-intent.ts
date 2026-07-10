import { siteConfig } from "@/lib/config";
import { getProactivePage } from "./proactive";
import type { ConciergeSession } from "./types";
import { hasTransferableQuoteData } from "./wizard-bridge";

export const EXIT_INTENT_KEY = "ilyashan-concierge-exit-seen";

export function shouldShowExitIntent(pathname: string): boolean {
  return getProactivePage(pathname) !== "other";
}

export function getExitIntentMessage(pathname: string, session?: ConciergeSession): string {
  const page = getProactivePage(pathname);

  if (page === "angebot") {
    return "Noch unsicher bei der Kalkulation? Ich erkläre Flügel, Etage und Live-Preis – oder rufen Sie uns direkt an.";
  }

  if (session && hasTransferableQuoteData(session)) {
    return "Ihre Angaben sind gespeichert – im Preisrechner übernehmen wir sie automatisch. Noch eine Frage?";
  }

  return `Bevor Sie gehen: Live-Preisschätzung in unter 2 Minuten – ich helfe bei Fensterreinigung in ${siteConfig.contact.region}.`;
}

export function isDesktopPointerFine(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}
