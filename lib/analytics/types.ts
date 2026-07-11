export type AnalyticsChannel =
  | "direct"
  | "organic"
  | "cpc"
  | "social"
  | "referral"
  | "email"
  | "other";

export type AnalyticsEventType =
  | "session_start"
  | "session_end"
  | "heartbeat"
  | "pageview"
  | "page_leave"
  | "click"
  | "scroll"
  | "cookie_consent"
  | "wizard_step"
  | "wizard_field"
  | "wizard_submit"
  | "wizard_abandon"
  | "form_start"
  | "form_submit"
  | "phone_click"
  | "whatsapp_click"
  | "outbound_click"
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

export interface AnalyticsDeviceInfo {
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  locale: string;
}

export interface AnalyticsAttribution {
  referrer: string;
  referrerDomain: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  fbclid: string;
  channel: AnalyticsChannel;
}

export interface AnalyticsClientEvent {
  type: AnalyticsEventType;
  pagePath: string;
  pageTitle?: string;
  elementId?: string;
  elementTag?: string;
  elementText?: string;
  elementHref?: string;
  scrollDepth?: number;
  durationMs?: number;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

export interface AnalyticsCollectBody {
  visitorId: string;
  sessionId: string;
  sessionStart?: string;
  landingPath?: string;
  device?: AnalyticsDeviceInfo;
  attribution?: Partial<AnalyticsAttribution>;
  events: AnalyticsClientEvent[];
}

export interface AnalyticsSessionRow {
  id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number;
  is_bounce: boolean;
  landing_path: string;
  exit_path: string | null;
  page_views: number;
  event_count: number;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_width: number | null;
  screen_height: number | null;
  locale: string | null;
  country: string | null;
  city: string | null;
  referrer: string | null;
  referrer_domain: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  channel: string;
}

export interface AnalyticsEventRow {
  id: string;
  session_id: string;
  visitor_id: string;
  created_at: string;
  event_type: string;
  page_path: string;
  page_title: string | null;
  element_id: string | null;
  element_tag: string | null;
  element_text: string | null;
  element_href: string | null;
  scroll_depth: number | null;
  duration_ms: number | null;
  payload: Record<string, unknown>;
}
