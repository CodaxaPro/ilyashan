import { routes } from "@/lib/routes";
import { siteConfig } from "@/lib/config";

export type ProactivePage = "home" | "angebot" | "other";

export function getProactivePage(pathname: string): ProactivePage {
  if (pathname === routes.home || pathname === "/") return "home";
  if (pathname.startsWith(routes.angebot)) return "angebot";
  return "other";
}

export function getProactiveNudge(pathname: string): string {
  const page = getProactivePage(pathname);
  switch (page) {
    case "angebot":
      return "Brauchen Sie Hilfe bei der Kalkulation? Ich erkläre Flügel & Preis.";
    case "home":
      return `Live-Preisschätzung in 1 Minute – fragen Sie mich oder starten Sie den Rechner.`;
    default:
      return `Fragen zu Fensterreinigung in ${siteConfig.contact.region}? Ich helfe sofort.`;
  }
}

export const PROACTIVE_DELAY_MS = 30_000;
