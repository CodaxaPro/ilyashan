export type ConciergeAnalyticsEvent =
  | "concierge_open"
  | "concierge_message"
  | "concierge_intent"
  | "concierge_unknown"
  | "concierge_lead_shown"
  | "concierge_lead_submit"
  | "concierge_wizard_handoff"
  | "concierge_exit_intent"
  | "concierge_proactive_nudge"
  | "concierge_whatsapp_click";

export interface ConciergeAnalyticsParams {
  intent?: string;
  session_id?: string;
  page_path?: string;
  photo_count?: number;
}
