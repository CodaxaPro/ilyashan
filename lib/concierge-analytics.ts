import type { ConciergeAnalyticsEvent, ConciergeAnalyticsParams } from "@/lib/concierge-analytics-events";
import { trackAnalytics } from "@/lib/analytics/client";

export type { ConciergeAnalyticsEvent, ConciergeAnalyticsParams };

export function trackConciergeEvent(
  event: ConciergeAnalyticsEvent,
  params: ConciergeAnalyticsParams = {}
): boolean {
  trackAnalytics(event, { payload: { ...params } });

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  window.gtag("event", event, {
    event_category: "concierge",
    ...params,
  });
  return true;
}
