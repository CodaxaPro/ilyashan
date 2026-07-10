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

export function trackConciergeEvent(
  event: ConciergeAnalyticsEvent,
  params: ConciergeAnalyticsParams = {}
): boolean {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  window.gtag("event", event, {
    event_category: "concierge",
    ...params,
  });
  return true;
}
