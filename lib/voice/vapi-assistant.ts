/**
 * Vapi assistant payload for Ilyashan DE enterprise receptionist.
 * Mid-call tools → same CRM engines as chat (price / slots / book / callback).
 */
import { siteConfig } from "@/lib/config";

export const VAPI_ASSISTANT_NAME = "Ilyashan Telefon-Beratung";

export function buildVapiSystemPrompt(): string {
  return `Du bist die telefonische Beratung von ${siteConfig.name} in ${siteConfig.contact.region}.
Sprich warm, klar, professionell auf Deutsch (kurze Sätze, gut verständlich am Telefon).
Du bist keine Generische KI — du vertrittst Ilyashan und handelst wie eine erfahrene Empfangskraft.

FIRMA
- Adresse: ${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}
- Telefon: ${siteConfig.contact.phoneDisplay} · E-Mail: ${siteConfig.contact.email}
- Gebiet: ${siteConfig.contact.region} — ${siteConfig.serviceArea.noTravelFeeLabel}
- Team-Antwort: ca. ${siteConfig.business.responseTime}

LEISTUNGEN
Fensterreinigung, Büroreinigung, Treppenhausreinigung, Praxis, Bauend, Renovierung, Entrümpelung, Gutschein, Wartungsvertrag.

WERKZEUGE — PFLICHT
- Preis Fenster: IMMER Tool price_fenster (Flügelzahl + Etage). Keine erfundenen Euro.
- Termine anbieten: get_available_slots
- Verbindlich buchen: book_appointment (Name, Telefon, Datum JJJJ-MM-TT, vormittag|nachmittag, Flügelzahl; Etage wenn bekannt)
- Nur Rückruf / noch unklar: request_callback (Name, Telefon, optional Wunschtermin)
- Statische „ab …“-Preise nur als grobe Einstiegshilfe wenn Tool noch nicht möglich; sobald Flügel+Etage da → Tool.

ORIENTIERUNG (ohne Tool, kurz):
Privatfenster Mindestauftrag ab 49 € · Haus ab ca. 69 € · Rahmen ab 79 € · Solar ab 99 € · Wartung ab 59 €/Monat.
Büro/Praxis/Bauend/Renovierung/Entrümpelung: kein Sofortpreis — Festpreis nach Angaben, Rückruf oder Termin.

GESPRÄCHSABLAUF (Enterprise)
1) Bedarf klären
2) Bei Fenster: Flügel + Etage → price_fenster → Orientierung nennen
3) Name + Telefon bestätigen (Anrufernummer oft bekannt — als phone an Tools übergeben)
4) get_available_slots → 1–2 Optionen anbieten → book_appointment
5) Wenn Kunde nicht buchen will: request_callback mit Wunschzeit
6) Kurz zusammenfassen und verabschieden

Bei Stress, älteren Kunden oder Beschwerde: ruhig bleiben, request_callback mit humanischem Ton / Mitarbeiter-Rückruf.`;
}

export function buildVapiFirstMessage(): string {
  return `Guten Tag, hier ist die Beratung von ${siteConfig.name}. Wie kann ich Ihnen helfen — Fenster, Büro, Treppenhaus oder eine andere Reinigung?`;
}

function toolServerUrl(serverUrl: string): string {
  const u = new URL(serverUrl);
  u.pathname = "/api/voice/tools";
  return u.toString();
}

function functionTool(
  serverUrl: string,
  name: string,
  description: string,
  parameters: Record<string, unknown>
) {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters,
    },
    server: { url: toolServerUrl(serverUrl) },
  };
}

export function buildVapiAssistantTools(serverUrl: string): unknown[] {
  return [
    functionTool(
      serverUrl,
      "price_fenster",
      "Berechnet die Fenster-Preisorientierung (nur mit Flügelzahl und Etage).",
      {
        type: "object",
        properties: {
          windowCount: { type: "number", description: "Anzahl Fensterflügel" },
          floorLevel: {
            type: "string",
            description: "Etage: eg, og1, og2, og3, og4, og5plus, dg",
          },
        },
        required: ["windowCount", "floorLevel"],
      }
    ),
    functionTool(
      serverUrl,
      "get_available_slots",
      "Holt die nächsten freien Termine (Vormittag/Nachmittag).",
      {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max. Anzahl Slots, Standard 6" },
        },
      }
    ),
    functionTool(
      serverUrl,
      "book_appointment",
      "Bucht verbindlich einen Termin im Ilyashan-Kalender (gleiche Engine wie Website-Chat).",
      {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string", description: "Kunden-Telefon E.164 oder DE" },
          date: { type: "string", description: "JJJJ-MM-TT" },
          timeSlot: {
            type: "string",
            enum: ["vormittag", "nachmittag", "flexibel"],
          },
          windowCount: { type: "number" },
          floorLevel: { type: "string" },
          notes: { type: "string" },
        },
        required: ["name", "phone", "date", "timeSlot", "windowCount"],
      }
    ),
    functionTool(
      serverUrl,
      "request_callback",
      "Erstellt einen Rückruf-Lead im CRM (wenn keine Sofort-Buchung).",
      {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          date: { type: "string", description: "Optionaler Wunschtermin JJJJ-MM-TT" },
          timeSlot: {
            type: "string",
            enum: ["vormittag", "nachmittag", "flexibel"],
          },
          windowCount: { type: "number" },
          floorLevel: { type: "string" },
          reason: { type: "string" },
        },
        required: ["phone"],
      }
    ),
  ];
}

export function buildVapiAssistantCreateBody(serverUrl: string): Record<string, unknown> {
  return {
    name: VAPI_ASSISTANT_NAME,
    firstMessage: buildVapiFirstMessage(),
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [{ role: "system", content: buildVapiSystemPrompt() }],
      temperature: 0.35,
      tools: buildVapiAssistantTools(serverUrl),
    },
    voice: {
      provider: "11labs",
      voiceId: "EXAVITQu4vr4xnSDxMaL",
    },
    transcriber: {
      provider: "deepgram",
      language: "de",
    },
    serverUrl,
    serverMessages: ["end-of-call-report", "status-update", "tool-calls"],
    endCallMessage: `Vielen Dank. Wir melden uns bei Bedarf unter ${siteConfig.contact.phoneDisplay}. Auf Wiederhören!`,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
  };
}

/** Company line customers already know (forward target is Vapi number). */
export const ILYASHAN_PUBLIC_PHONE_E164 = "+491733828354";
export const ILYASHAN_PUBLIC_PHONE_DISPLAY = siteConfig.contact.phoneDisplay;
