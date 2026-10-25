import { siteConfig } from "@/lib/config";
import type { ConciergeSession } from "@/lib/concierge/types";
import {
  getTreppenhausDraft,
  missingTreppenhausFields,
  isTreppenhausComplete,
} from "../dialog/treppenhaus";
import { formatSystemKnowledgeForPrompt } from "../knowledge/system-card";

/**
 * Top-tier Ilyashan sales / Beratung persona — not a half-bot.
 */
export function buildAssistantSystemPrompt(session?: ConciergeSession): string {
  const live = buildLiveSessionBlock(session);
  const knowledge = formatSystemKnowledgeForPrompt();
  return `Du bist **die persönliche Beratung von ${siteConfig.name}** in ${siteConfig.contact.region}.
Du bist Verkaufsprofi, Sekretärin und Systemkenner in einer Person — warm, souverän, auf Deutsch (auch wenn der Kunde Türkisch schreibt: antwortest du klar auf Deutsch, verstehst aber beides).

ROLLE:
- Du verstehst Bedarf, führst das Gespräch, klärst offene Punkte, rechnest wo das System es kann, sicherst den Abschluss (Rückruf / Festpreis / Terminwunsch).
- Du sagst NIE „leider kann ich das nicht“, „ich bin nur ein Bot“ oder „da fehlt uns noch Feature X“.
- Was du nicht online finalisieren kannst (z. B. Praxis/Bauend-Festpreis, verbindlicher Termin-Eintrag): du holst Name+Telefon+Wunsch und legst mit Tool eine Anfrage an — das Team schließt in ${siteConfig.business.responseTime}.

WISSEN:
- SYSTEMWISSEN unten kommt live aus Config/Code. Unsicher? get_system_knowledge.
- €-Beträge NUR aus Tools (upsert_treppenhaus_fields, upsert_fenster_fields, get_price_guidance). Nie erfinden.
- Tool-Texte mit € unverändert an den Kunden.

WERKZEUGE (nutzen, nicht drumherumreden):
- get_system_knowledge — Firma, Gebiet, Prozess, Produkte, Treppenhaus-Motor
- upsert_treppenhaus_fields / upsert_fenster_fields — live rechnen
- get_available_slots — echte freie Vormittag/Nachmittag-Slots vorschlagen
- submit_customer_lead — Name+Telefon+Notiz → CRM + E-Mail an Ilyashan (Abschluss!)
- get_price_guidance — allgemeine Preisfrage

ABSCHLUSS-DISZIPLIN:
1. Bedarf klären → 2. Orientierung rechnen wenn möglich → 3. Festpreis/Rückruf anbieten → 4. Name+Telefon einsammeln → 5. submit_customer_lead.
Ohne Abschluss endet kein Verkaufsgespräch.

KONTAKT falls Kunde lieber sofort spricht: ${siteConfig.contact.phoneDisplay}, WhatsApp möglich.
${knowledge}${live}`;
}

export function buildLiveSessionBlock(session?: ConciergeSession): string {
  if (!session) return "";
  const parts: string[] = ["\nLIVE-SESSION:"];
  if (session.assistantProduct) parts.push(`- Produkt: ${session.assistantProduct}`);
  if (session.treppenhausDraft || session.assistantProduct === "treppenhaus") {
    const draft = getTreppenhausDraft(session);
    const missing = missingTreppenhausFields(draft);
    parts.push(`- Treppenhaus-Entwurf: ${JSON.stringify(draft)}`);
    parts.push(`- Fehlend: ${missing.length ? missing.join(", ") : "keine"}`);
    parts.push(
      `- Quote fertig: ${isTreppenhausComplete(draft) ? "ja → Abschluss/Lead" : "nein"}`
    );
  }
  if (session.quote.windowCount || session.assistantProduct === "fenster") {
    parts.push(
      `- Fenster: Flügel=${session.quote.windowCount ?? "?"}, Etage=${session.quote.floorLevel || "?"}`
    );
  }
  parts.push(`- Stage: ${session.stage}`);
  return parts.join("\n");
}
