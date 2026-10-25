import type { QuoteFormData } from "@/lib/quote-form";
import type { TreppenhausInput } from "@/lib/treppenhaus/pricing";

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

export type AssistantProduct =
  | "fenster"
  | "buero"
  | "treppenhaus"
  | "praxis"
  | "bauend"
  | "renovierung"
  | "entruempelung"
  | "gutschein";

export type BueroChatDraft = {
  totalAreaM2?: number;
  frequency?: "ONE_TIME" | "1_PER_WEEK" | "2_PER_WEEK" | "3_PER_WEEK" | "5_PER_WEEK";
  workstations?: number;
};

export interface ConciergeSession {
  id: string;
  stage: ConciergeStage;
  quote: Partial<QuoteFormData>;
  lastIntent?: ConciergeIntent;
  turns: number;
  /** Active multi-product assistant dialog (chat calculation). */
  assistantProduct?: AssistantProduct | null;
  /** Partial Treppenhaus inputs collected in conversation. */
  treppenhausDraft?: Partial<TreppenhausInput>;
  /** Partial Büro inputs for chat orientation. */
  bueroDraft?: BueroChatDraft;
  /** Free notes for Festpreis cases (Praxis, Bauend, …). */
  salesNotes?: string;
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
