import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  SERVICE_AREA_ZONE_LABELS_TR,
  sessionRowToGeo,
  type ServiceAreaZone,
} from "./geo";
import type { AnalyticsEventRow, AnalyticsSessionRow } from "./types";

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export interface AnalyticsOverview {
  totalSessions: number;
  totalPageviews: number;
  totalEvents: number;
  uniqueVisitors: number;
  avgDurationSec: number;
  bounceRate: number;
  conversions: number;
  conciergeOpens: number;
  serviceAreaSessions: number;
  topCity: string;
  daily: Array<{
    date: string;
    sessions: number;
    pageviews: number;
    events: number;
  }>;
}

export async function getAnalyticsOverview(days = 7): Promise<AnalyticsOverview | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const since = daysAgoIso(days);

  const { data: sessions } = await supabase
    .from("analytics_sessions")
    .select("*")
    .gte("started_at", since)
    .order("started_at", { ascending: false });

  const rows = (sessions ?? []) as AnalyticsSessionRow[];
  const sessionIds = rows.map((s) => s.id);

  let events: AnalyticsEventRow[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from("analytics_events")
      .select("*")
      .in("session_id", sessionIds)
      .gte("created_at", since);
    events = (data ?? []) as AnalyticsEventRow[];
  }

  const uniqueVisitors = new Set(rows.map((s) => s.visitor_id)).size;
  const totalPageviews = rows.reduce((sum, s) => sum + (s.page_views ?? 0), 0);
  const avgDurationSec =
    rows.length > 0
      ? Math.round(rows.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0) / rows.length / 1000)
      : 0;
  const bounceRate =
    rows.length > 0
      ? Math.round((rows.filter((s) => s.is_bounce).length / rows.length) * 100)
      : 0;
  const conversions = events.filter(
    (e) => e.event_type === "wizard_submit" || e.event_type === "form_submit"
  ).length;
  const conciergeOpens = events.filter((e) => e.event_type === "concierge_open").length;
  const serviceAreaSessions = rows.filter((s) => sessionRowToGeo(s).inServiceArea).length;

  const cityCounts = new Map<string, number>();
  for (const session of rows) {
    const geo = sessionRowToGeo(session);
    if (!geo.labelShort || geo.labelShort === "—") continue;
    cityCounts.set(geo.labelShort, (cityCounts.get(geo.labelShort) ?? 0) + 1);
  }
  const topCity =
    [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const dailyMap = new Map<string, { sessions: number; pageviews: number; events: number }>();
  for (const session of rows) {
    const date = session.started_at.slice(0, 10);
    const entry = dailyMap.get(date) ?? { sessions: 0, pageviews: 0, events: 0 };
    entry.sessions += 1;
    entry.pageviews += session.page_views ?? 0;
    dailyMap.set(date, entry);
  }
  for (const event of events) {
    const date = event.created_at.slice(0, 10);
    const entry = dailyMap.get(date) ?? { sessions: 0, pageviews: 0, events: 0 };
    entry.events += 1;
    dailyMap.set(date, entry);
  }

  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({ date, ...stats }));

  return {
    totalSessions: rows.length,
    totalPageviews,
    totalEvents: events.length,
    uniqueVisitors,
    avgDurationSec,
    bounceRate,
    conversions,
    conciergeOpens,
    serviceAreaSessions,
    topCity,
    daily,
  };
}

export async function getLiveSessions(limitMinutes = 5): Promise<AnalyticsSessionRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const since = new Date(Date.now() - limitMinutes * 60_000).toISOString();
  const { data } = await supabase
    .from("analytics_sessions")
    .select("*")
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .limit(50);

  return (data ?? []) as AnalyticsSessionRow[];
}

export async function getChannelStats(days = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const since = daysAgoIso(days);
  const { data } = await supabase
    .from("analytics_sessions")
    .select("channel, page_views, duration_ms, is_bounce")
    .gte("started_at", since);

  const map = new Map<
    string,
    { channel: string; sessions: number; pageviews: number; avgDurationSec: number; bounceRate: number }
  >();

  for (const row of data ?? []) {
    const channel = row.channel ?? "direct";
    const entry = map.get(channel) ?? {
      channel,
      sessions: 0,
      pageviews: 0,
      avgDurationSec: 0,
      bounceRate: 0,
    };
    entry.sessions += 1;
    entry.pageviews += row.page_views ?? 0;
    entry.avgDurationSec += (row.duration_ms ?? 0) / 1000;
    entry.bounceRate += row.is_bounce ? 1 : 0;
    map.set(channel, entry);
  }

  return [...map.values()].map((entry) => ({
    ...entry,
    avgDurationSec: entry.sessions ? Math.round(entry.avgDurationSec / entry.sessions) : 0,
    bounceRate: entry.sessions ? Math.round((entry.bounceRate / entry.sessions) * 100) : 0,
  }));
}

export async function getPageStats(days = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const since = daysAgoIso(days);
  const { data } = await supabase
    .from("analytics_events")
    .select("page_path, event_type, duration_ms, payload")
    .gte("created_at", since)
    .in("event_type", ["pageview", "page_leave", "click"]);

  const map = new Map<
    string,
    {
      path: string;
      views: number;
      clicks: number;
      totalDurationMs: number;
      leaveCount: number;
      topFrom: Map<string, number>;
    }
  >();

  for (const row of data ?? []) {
    const path = row.page_path;
    const entry = map.get(path) ?? {
      path,
      views: 0,
      clicks: 0,
      totalDurationMs: 0,
      leaveCount: 0,
      topFrom: new Map<string, number>(),
    };
    if (row.event_type === "pageview") {
      entry.views += 1;
      const payload = (row.payload ?? {}) as {
        fromUrl?: string;
        referrer?: string;
        fromPath?: string;
        fromType?: string;
      };
      const fromLabel =
        payload.fromType === "internal" && payload.fromPath
          ? payload.fromPath
          : payload.fromUrl || payload.referrer || "Doğrudan";
      entry.topFrom.set(fromLabel, (entry.topFrom.get(fromLabel) ?? 0) + 1);
    }
    if (row.event_type === "click") entry.clicks += 1;
    if (row.event_type === "page_leave") {
      entry.leaveCount += 1;
      entry.totalDurationMs += row.duration_ms ?? 0;
    }
    map.set(path, entry);
  }

  return [...map.values()]
    .map((entry) => {
      const topReferrer =
        [...entry.topFrom.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      return {
        path: entry.path,
        views: entry.views,
        clicks: entry.clicks,
        avgTimeSec: entry.leaveCount
          ? Math.round(entry.totalDurationMs / entry.leaveCount / 1000)
          : 0,
        topReferrer,
      };
    })
    .sort((a, b) => b.views - a.views);
}

export async function getClickStats(days = 30, limit = 50) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const since = daysAgoIso(days);
  const { data } = await supabase
    .from("analytics_events")
    .select("element_id, element_text, element_href, page_path")
    .eq("event_type", "click")
    .gte("created_at", since);

  const map = new Map<string, { label: string; page: string; href: string; count: number }>();
  for (const row of data ?? []) {
    const label =
      row.element_id ||
      row.element_text?.slice(0, 80) ||
      row.element_href?.slice(0, 80) ||
      "Bilinmeyen";
    const key = `${row.page_path}::${label}`;
    const entry = map.get(key) ?? {
      label,
      page: row.page_path,
      href: row.element_href ?? "",
      count: 0,
    };
    entry.count += 1;
    map.set(key, entry);
  }

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function getFunnelStats(days = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const since = daysAgoIso(days);
  const { data } = await supabase
    .from("analytics_events")
    .select("event_type, payload, session_id")
    .gte("created_at", since)
    .in("event_type", ["wizard_step", "wizard_submit", "wizard_abandon"]);

  const stepSessions = new Map<number, Set<string>>();
  const submitSessions = new Set<string>();
  const abandonSessions = new Set<string>();

  for (const row of data ?? []) {
    if (row.event_type === "wizard_step") {
      const step = Number((row.payload as { step?: number })?.step ?? 0);
      if (!stepSessions.has(step)) stepSessions.set(step, new Set());
      stepSessions.get(step)!.add(row.session_id);
    }
    if (row.event_type === "wizard_submit") submitSessions.add(row.session_id);
    if (row.event_type === "wizard_abandon") abandonSessions.add(row.session_id);
  }

  const steps = [1, 2, 3, 4, 5].map((step) => ({
    step,
    sessions: stepSessions.get(step)?.size ?? 0,
  }));

  return {
    steps,
    submits: submitSessions.size,
    abandons: abandonSessions.size,
  };
}

export async function getConciergeStats(days = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const since = daysAgoIso(days);
  const { data } = await supabase
    .from("analytics_events")
    .select("event_type, payload")
    .gte("created_at", since)
    .like("event_type", "concierge_%");

  const counts: Record<string, number> = {};
  const intents: Record<string, number> = {};

  for (const row of data ?? []) {
    counts[row.event_type] = (counts[row.event_type] ?? 0) + 1;
    if (row.event_type === "concierge_intent") {
      const intent = String((row.payload as { intent?: string })?.intent ?? "unknown");
      intents[intent] = (intents[intent] ?? 0) + 1;
    }
  }

  return { counts, intents };
}

export async function listSessions(limit = 50, offset = 0, days = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { sessions: [], total: 0 };

  const since = daysAgoIso(days);
  const { data, count } = await supabase
    .from("analytics_sessions")
    .select("*", { count: "exact" })
    .gte("started_at", since)
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { sessions: (data ?? []) as AnalyticsSessionRow[], total: count ?? 0 };
}

export async function getSessionDetail(sessionId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: session } = await supabase
    .from("analytics_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return null;

  const { data: events } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return {
    session: session as AnalyticsSessionRow,
    events: (events ?? []) as AnalyticsEventRow[],
  };
}

export async function getReferrerStats(days = 30, limit = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const since = daysAgoIso(days);
  const { data } = await supabase
    .from("analytics_sessions")
    .select("referrer, referrer_domain, utm_source, utm_term, channel, landing_path")
    .gte("started_at", since);

  const map = new Map<string, { label: string; channel: string; count: number }>();
  for (const row of data ?? []) {
    const label =
      row.utm_source && row.utm_term
        ? `${row.utm_source} / ${row.utm_term}`
        : row.referrer || row.referrer_domain || row.landing_path || row.utm_source || "Doğrudan";
    const key = `${row.channel}::${label}`;
    const entry = map.get(key) ?? { label, channel: row.channel ?? "direct", count: 0 };
    entry.count += 1;
    map.set(key, entry);
  }

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function getGeoStats(days = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      countries: [],
      cities: [],
      zones: [],
      totalSessions: 0,
      locatedSessions: 0,
      serviceAreaSessions: 0,
    };
  }

  const since = daysAgoIso(days);
  const { data } = await supabase
    .from("analytics_sessions")
    .select("*")
    .gte("started_at", since);

  const rows = (data ?? []) as AnalyticsSessionRow[];
  const countryMap = new Map<
    string,
    { countryCode: string; countryName: string; sessions: number; inServiceArea: number }
  >();
  const cityMap = new Map<
    string,
    {
      city: string;
      regionName: string;
      countryName: string;
      sessions: number;
      zone: ServiceAreaZone;
      inServiceArea: number;
      latitude: number | null;
      longitude: number | null;
      mapsUrl: string;
    }
  >();
  const zoneMap = new Map<ServiceAreaZone, number>();

  let locatedSessions = 0;
  let serviceAreaSessions = 0;

  for (const row of rows) {
    const geo = sessionRowToGeo(row);
    if (geo.city || geo.countryCode) locatedSessions += 1;
    if (geo.inServiceArea) serviceAreaSessions += 1;

    const zone = geo.serviceAreaZone;
    zoneMap.set(zone, (zoneMap.get(zone) ?? 0) + 1);

    if (geo.countryCode) {
      const key = geo.countryCode;
      const entry = countryMap.get(key) ?? {
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        sessions: 0,
        inServiceArea: 0,
      };
      entry.sessions += 1;
      if (geo.inServiceArea) entry.inServiceArea += 1;
      countryMap.set(key, entry);
    }

    if (geo.city) {
      const key = `${geo.countryCode}::${geo.city}`;
      const entry = cityMap.get(key) ?? {
        city: geo.city,
        regionName: geo.regionName,
        countryName: geo.countryName,
        sessions: 0,
        zone: geo.serviceAreaZone,
        inServiceArea: 0,
        latitude: geo.latitude,
        longitude: geo.longitude,
        mapsUrl: geo.mapsUrl,
      };
      entry.sessions += 1;
      if (geo.inServiceArea) entry.inServiceArea += 1;
      cityMap.set(key, entry);
    }
  }

  const totalSessions = rows.length;
  const zones = [...zoneMap.entries()]
    .map(([zone, sessions]) => ({
      zone,
      label: SERVICE_AREA_ZONE_LABELS_TR[zone],
      sessions,
      percentage: totalSessions ? Math.round((sessions / totalSessions) * 100) : 0,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    countries: [...countryMap.values()].sort((a, b) => b.sessions - a.sessions),
    cities: [...cityMap.values()].sort((a, b) => b.sessions - a.sessions),
    zones,
    totalSessions,
    locatedSessions,
    serviceAreaSessions,
  };
}
