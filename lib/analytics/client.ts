"use client";

import type { AnalyticsClientEvent, AnalyticsEventType } from "./types";

const VISITOR_KEY = "ilyashan_vid";
const SESSION_KEY = "ilyashan_sid";
const SESSION_START_KEY = "ilyashan_sstart";
const LANDING_KEY = "ilyashan_landing";
const QUEUE_KEY = "ilyashan_analytics_queue";

let initialized = false;
let pageStartMs = 0;
let maxScrollDepth = 0;
let heartbeatTimer: number | null = null;
let activeMs = 0;
let lastActiveMark = 0;

function canTrack(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("ilyashan-cookie-consent") === "accepted";
  } catch {
    return false;
  }
}

function uuid(): string {
  return crypto.randomUUID();
}

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.setItem(SESSION_START_KEY, new Date().toISOString());
    sessionStorage.setItem(LANDING_KEY, `${window.location.pathname}${window.location.search}`);
  }
  return id;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const width = window.screen.width;
  const mobile = /Mobi|Android/i.test(ua);
  const tablet = !mobile && width <= 1024 && "ontouchstart" in window;

  let browser = "Diğer";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";

  let os = "Diğer";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return {
    deviceType: mobile ? ("mobile" as const) : tablet ? ("tablet" as const) : ("desktop" as const),
    browser,
    os,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    locale: navigator.language,
  };
}

function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer ?? "";
  let referrerDomain = "";
  try {
    referrerDomain = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    referrerDomain = "";
  }

  const utmSource = params.get("utm_source") ?? "";
  const utmMedium = params.get("utm_medium") ?? "";
  const gclid = params.get("gclid") ?? "";

  let channel: "direct" | "organic" | "cpc" | "social" | "referral" | "email" | "other" = "direct";
  if (gclid || utmMedium === "cpc" || utmMedium === "ppc") channel = "cpc";
  else if (utmMedium === "email") channel = "email";
  else if (utmMedium === "social") channel = "social";
  else if (/google\.|bing\.|duckduckgo\./.test(referrerDomain)) channel = "organic";
  else if (referrerDomain) channel = "referral";
  else if (utmSource || utmMedium) channel = "other";

  return {
    referrer,
    referrerDomain,
    utmSource,
    utmMedium,
    utmCampaign: params.get("utm_campaign") ?? "",
    utmTerm: params.get("utm_term") ?? "",
    utmContent: params.get("utm_content") ?? "",
    gclid,
    channel,
  };
}

function readQueue(): AnalyticsClientEvent[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsClientEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(events: AnalyticsClientEvent[]) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-100)));
  } catch {
    /* ignore */
  }
}

function enqueue(event: AnalyticsClientEvent) {
  if (!canTrack()) return;
  const queue = readQueue();
  queue.push({
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  });
  writeQueue(queue);
  if (queue.length >= 8) void flushAnalytics();
}

export function trackAnalytics(
  type: AnalyticsEventType,
  data: Partial<AnalyticsClientEvent> = {}
) {
  if (typeof window === "undefined") return;
  enqueue({
    type,
    pagePath: data.pagePath ?? window.location?.pathname ?? "/",
    pageTitle: data.pageTitle ?? (typeof document !== "undefined" ? document.title : undefined),
    elementId: data.elementId,
    elementTag: data.elementTag,
    elementText: data.elementText,
    elementHref: data.elementHref,
    scrollDepth: data.scrollDepth,
    durationMs: data.durationMs,
    payload: data.payload,
  });
}

export async function flushAnalytics(useBeacon = false): Promise<void> {
  if (!canTrack()) return;
  const queue = readQueue();
  if (queue.length === 0) return;

  writeQueue([]);
  const body = JSON.stringify({
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    sessionStart: sessionStorage.getItem(SESSION_START_KEY) ?? new Date().toISOString(),
    landingPath: sessionStorage.getItem(LANDING_KEY) ?? window.location.pathname,
    device: getDeviceInfo(),
    attribution: getAttribution(),
    events: queue,
  });

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics/collect",
      new Blob([body], { type: "application/json" })
    );
    return;
  }

  try {
    await fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    writeQueue([...queue, ...readQueue()]);
  }
}

function markActive() {
  const now = Date.now();
  if (lastActiveMark > 0 && !document.hidden) {
    activeMs += now - lastActiveMark;
  }
  lastActiveMark = now;
}

function computeScrollDepth(): number {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const viewport = window.innerHeight;
  const height = Math.max(doc.scrollHeight - viewport, 1);
  return Math.min(100, Math.round((scrollTop / height) * 100));
}

function handleClick(event: MouseEvent) {
  if (!canTrack()) return;
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const el =
    target.closest("[data-analytics-id], a, button, [role='button'], input[type='submit']") ??
    target;
  const htmlEl = el as HTMLElement;
  const anchor = el.closest("a") as HTMLAnchorElement | null;

  const elementId = htmlEl.getAttribute("data-analytics-id") ?? htmlEl.id ?? "";
  const elementHref = anchor?.href ?? "";
  const elementText = (htmlEl.textContent ?? "").trim().slice(0, 120);
  const elementTag = htmlEl.tagName.toLowerCase();

  if (elementHref.startsWith("tel:")) {
    trackAnalytics("phone_click", { elementId: elementId || "phone", elementHref, elementText, elementTag });
  } else if (elementHref.includes("wa.me") || elementHref.includes("whatsapp")) {
    trackAnalytics("whatsapp_click", {
      elementId: elementId || "whatsapp",
      elementHref,
      elementText,
      elementTag,
    });
  } else if (elementHref && !elementHref.includes(window.location.hostname)) {
    trackAnalytics("outbound_click", { elementId, elementHref, elementText, elementTag });
  } else {
    trackAnalytics("click", { elementId, elementHref, elementText, elementTag });
  }
}

function handleScroll() {
  const depth = computeScrollDepth();
  if (depth <= maxScrollDepth) return;
  const milestones = [25, 50, 75, 100];
  for (const milestone of milestones) {
    if (depth >= milestone && maxScrollDepth < milestone) {
      maxScrollDepth = milestone;
      trackAnalytics("scroll", { scrollDepth: milestone });
    }
  }
}

function trackPageLeave() {
  markActive();
  trackAnalytics("page_leave", {
    durationMs: activeMs,
    scrollDepth: computeScrollDepth(),
  });
  void flushAnalytics(true);
}

function startHeartbeat() {
  if (heartbeatTimer) window.clearInterval(heartbeatTimer);
  heartbeatTimer = window.setInterval(() => {
    markActive();
    trackAnalytics("heartbeat", { durationMs: 15000, payload: { activeMs } });
    void flushAnalytics();
  }, 15000);
}

export function initAnalyticsClient() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const boot = () => {
    if (!canTrack()) return;
    pageStartMs = Date.now();
    lastActiveMark = pageStartMs;
    activeMs = 0;
    maxScrollDepth = 0;

    trackAnalytics("session_start");
    trackAnalytics("pageview");
    startHeartbeat();
  };

  boot();

  document.addEventListener("click", handleClick, true);
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) trackPageLeave();
    else lastActiveMark = Date.now();
  });
  window.addEventListener("pagehide", trackPageLeave);
  window.addEventListener("beforeunload", trackPageLeave);

  window.addEventListener("cookie-consent-change", (event) => {
    const choice = (event as CustomEvent<"accepted" | "rejected">).detail;
    if (choice === "accepted") {
      trackAnalytics("cookie_consent", { payload: { choice: "accepted" } });
      boot();
    } else if (choice === "rejected") {
      trackAnalytics("cookie_consent", { payload: { choice: "rejected" } });
    }
  });

  window.addEventListener("popstate", () => {
    maxScrollDepth = 0;
    activeMs = 0;
    lastActiveMark = Date.now();
    trackAnalytics("pageview");
  });
}

export function trackPageView(path?: string, title?: string) {
  trackAnalytics("pageview", {
    pagePath: path ?? window.location.pathname,
    pageTitle: title ?? document.title,
  });
}
