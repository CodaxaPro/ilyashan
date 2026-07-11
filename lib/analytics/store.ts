import { createHash } from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { extractRequestGeo } from "@/lib/analytics/geo";
import type {
  AnalyticsAttribution,
  AnalyticsClientEvent,
  AnalyticsCollectBody,
  AnalyticsDeviceInfo,
} from "./types";

export function isAnalyticsStoreConfigured(): boolean {
  return isSupabaseConfigured();
}

export { extractRequestGeo };

function hashIp(ip: string): string {
  const salt = process.env.ANALYTICS_IP_SALT ?? process.env.ADMIN_PASSWORD ?? "ilyashan";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function ensureVisitor(visitorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data: existing } = await supabase
    .from("analytics_visitors")
    .select("id")
    .eq("id", visitorId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("analytics_visitors")
      .update({ last_seen: new Date().toISOString(), consent_analytics: true })
      .eq("id", visitorId);
    return true;
  }

  const { error } = await supabase.from("analytics_visitors").insert({
    id: visitorId,
    consent_analytics: true,
  });

  return !error;
}

async function ensureSession(
  body: AnalyticsCollectBody,
  geo: ReturnType<typeof extractRequestGeo>,
  ipHash?: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const { data: existing } = await supabase
    .from("analytics_sessions")
    .select("id")
    .eq("id", body.sessionId)
    .maybeSingle();

  const attribution = body.attribution ?? {};
  const device = body.device;

  if (existing) return true;

  const { error } = await supabase.from("analytics_sessions").insert({
    id: body.sessionId,
    visitor_id: body.visitorId,
    started_at: body.sessionStart ?? new Date().toISOString(),
    landing_path: body.landingPath ?? "/",
    device_type: device?.deviceType ?? null,
    browser: device?.browser ?? null,
    os: device?.os ?? null,
    screen_width: device?.screenWidth ?? null,
    screen_height: device?.screenHeight ?? null,
    locale: device?.locale ?? null,
    country: geo.countryCode || null,
    city: geo.city || null,
    region: geo.regionName || null,
    region_code: geo.regionCode || null,
    continent: geo.continent || null,
    timezone: geo.timezone || null,
    latitude: geo.latitude,
    longitude: geo.longitude,
    service_area_zone: geo.serviceAreaZone,
    service_area_match: geo.serviceAreaMatch || null,
    in_service_area: geo.inServiceArea,
    ip_hash: ipHash ?? null,
    referrer: attribution.referrer ?? null,
    referrer_domain: attribution.referrerDomain ?? null,
    utm_source: attribution.utmSource ?? null,
    utm_medium: attribution.utmMedium ?? null,
    utm_campaign: attribution.utmCampaign ?? null,
    utm_term: attribution.utmTerm ?? null,
    utm_content: attribution.utmContent ?? null,
    gclid: attribution.gclid ?? null,
    fbclid: attribution.fbclid ?? null,
    channel: attribution.channel ?? "direct",
  });

  return !error;
}

async function updateSessionMetrics(
  sessionId: string,
  events: AnalyticsClientEvent[]
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase || events.length === 0) return;

  const { data: session } = await supabase
    .from("analytics_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return;

  const pageViews = events.filter((e) => e.type === "pageview").length;
  const lastEvent = events[events.length - 1];
  const hasEngagement = events.some((e) =>
    ["click", "scroll", "wizard_step", "form_submit", "concierge_open"].includes(e.type)
  );
  const heartbeatDuration = events
    .filter((e) => e.type === "heartbeat" || e.type === "page_leave")
    .reduce((sum, e) => sum + (e.durationMs ?? 0), 0);

  const durationMs = Math.max(session.duration_ms ?? 0, heartbeatDuration);
  const endedAt =
    events.some((e) => e.type === "session_end" || e.type === "page_leave")
      ? new Date().toISOString()
      : session.ended_at;

  await supabase
    .from("analytics_sessions")
    .update({
      page_views: (session.page_views ?? 0) + pageViews,
      event_count: (session.event_count ?? 0) + events.length,
      exit_path: lastEvent?.pagePath ?? session.exit_path,
      duration_ms: durationMs,
      is_bounce: !hasEngagement && (session.page_views ?? 0) + pageViews <= 1,
      ended_at: endedAt,
    })
    .eq("id", sessionId);
}

export async function ingestAnalyticsBatch(
  body: AnalyticsCollectBody,
  request: Request
): Promise<{ ok: boolean; error?: string }> {
  if (!isAnalyticsStoreConfigured()) {
    return { ok: false, error: "Analytics storage not configured" };
  }

  if (!isUuid(body.visitorId) || !isUuid(body.sessionId)) {
    return { ok: false, error: "Invalid visitor or session id" };
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return { ok: false, error: "No events" };
  }

  if (body.events.length > 50) {
    return { ok: false, error: "Too many events in batch" };
  }

  const visitorOk = await ensureVisitor(body.visitorId);
  if (!visitorOk) return { ok: false, error: "Visitor persist failed" };

  const geo = extractRequestGeo(request);
  const ipHash = geo.ip ? hashIp(geo.ip) : undefined;
  const sessionOk = await ensureSession(body, geo, ipHash);
  if (!sessionOk) return { ok: false, error: "Session persist failed" };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Supabase unavailable" };

  const rows = body.events.map((event) => ({
    session_id: body.sessionId,
    visitor_id: body.visitorId,
    created_at: event.timestamp ?? new Date().toISOString(),
    event_type: event.type,
    page_path: event.pagePath.slice(0, 500),
    page_title: event.pageTitle?.slice(0, 300) ?? null,
    element_id: event.elementId?.slice(0, 200) ?? null,
    element_tag: event.elementTag?.slice(0, 50) ?? null,
    element_text: event.elementText?.slice(0, 300) ?? null,
    element_href: event.elementHref?.slice(0, 500) ?? null,
    scroll_depth: event.scrollDepth ?? null,
    duration_ms: event.durationMs ?? null,
    payload: event.payload ?? {},
  }));

  const { error } = await supabase.from("analytics_events").insert(rows);
  if (error) return { ok: false, error: error.message };

  await updateSessionMetrics(body.sessionId, body.events);
  return { ok: true };
}

export type { AnalyticsAttribution, AnalyticsDeviceInfo };
