import type { QuoteFormData } from "@/lib/quote-form";

export type ConciergeIntent =
  | "greeting"
  | "thanks"
  | "price"
  | "price_collect"
  | "services"
  | "service_detail"
  | "area"
  | "process"
  | "festpreis_info"
  | "insurance"
  | "winter"
  | "appointment"
  | "fluegel_help"
  | "contact"
  | "callback"
  | "wizard"
  | "faq_match"
  | "out_of_scope"
  | "unknown";

export type ConciergeStage =
  | "idle"
  | "price_need_fluegel"
  | "price_need_floor"
  | "price_ready";

export interface ConciergeAction {
  type: "link" | "phone" | "whatsapp";
  label: string;
  href: string;
}

export interface ConciergeSession {
  id: string;
  stage: ConciergeStage;
  quote: Partial<QuoteFormData>;
  lastIntent?: ConciergeIntent;
  turns: number;
}

export interface ConciergeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ConciergeReply {
  text: string;
  intent: ConciergeIntent;
  session: ConciergeSession;
  actions: ConciergeAction[];
  quickReplies: string[];
}

export const CONCIERGE_QUICK_REPLIES = [
  "Was kostet meine Fensterreinigung?",
  "Welche Leistungen bieten Sie?",
  "Einsatzgebiet & Anfahrt",
  "Wie funktioniert der Preisrechner?",
  "Wie zähle ich Flügel?",
] as const;

export function createSession(id = "new"): ConciergeSession {
  return {
    id,
    stage: "idle",
    quote: {
      services: ["privat"],
      windowCount: 0,
      dirtLevel: "normal",
      cleaningSide: "innen_aussen",
      roomHeight: 2.5,
    },
    turns: 0,
  };
}
