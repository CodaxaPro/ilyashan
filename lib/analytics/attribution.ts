import type { AnalyticsAttribution, AnalyticsChannel } from "./types";

const SEARCH_ENGINES = [
  "google.",
  "bing.",
  "duckduckgo.",
  "yahoo.",
  "ecosia.",
  "baidu.",
  "yandex.",
];

const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "pinterest.com",
];

function normalizeDomain(value: string): string {
  try {
    const host = new URL(value.startsWith("http") ? value : `https://${value}`).hostname;
    return host.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function parseReferrerDomain(referrer: string): string {
  if (!referrer) return "";
  return normalizeDomain(referrer);
}

export function resolveChannel(input: {
  utmMedium?: string;
  utmSource?: string;
  gclid?: string;
  fbclid?: string;
  referrerDomain?: string;
}): AnalyticsChannel {
  const medium = (input.utmMedium ?? "").toLowerCase();
  const source = (input.utmSource ?? "").toLowerCase();
  const referrerDomain = (input.referrerDomain ?? "").toLowerCase();

  if (input.gclid || medium === "cpc" || medium === "ppc" || medium === "paid") {
    return "cpc";
  }
  if (input.fbclid || medium === "social" || SOCIAL_DOMAINS.some((d) => referrerDomain.includes(d))) {
    return "social";
  }
  if (medium === "email" || source.includes("newsletter")) return "email";
  if (
    medium === "organic" ||
    SEARCH_ENGINES.some((engine) => referrerDomain.includes(engine))
  ) {
    return "organic";
  }
  if (referrerDomain) return "referral";
  if (medium || source) return "other";
  return "direct";
}

export function parseAttributionFromUrl(
  pageUrl: string,
  referrer: string
): AnalyticsAttribution {
  let utmSource = "";
  let utmMedium = "";
  let utmCampaign = "";
  let utmTerm = "";
  let utmContent = "";
  let gclid = "";
  let fbclid = "";

  try {
    const url = new URL(pageUrl);
    utmSource = url.searchParams.get("utm_source") ?? "";
    utmMedium = url.searchParams.get("utm_medium") ?? "";
    utmCampaign = url.searchParams.get("utm_campaign") ?? "";
    utmTerm = url.searchParams.get("utm_term") ?? "";
    utmContent = url.searchParams.get("utm_content") ?? "";
    gclid = url.searchParams.get("gclid") ?? "";
    fbclid = url.searchParams.get("fbclid") ?? "";
  } catch {
    /* ignore */
  }

  const referrerDomain = parseReferrerDomain(referrer);
  const channel = resolveChannel({
    utmMedium,
    utmSource,
    gclid,
    fbclid,
    referrerDomain,
  });

  return {
    referrer,
    referrerDomain,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    gclid,
    fbclid,
    channel,
  };
}

export const CHANNEL_LABELS_TR: Record<AnalyticsChannel, string> = {
  direct: "Doğrudan",
  organic: "Organik Arama",
  cpc: "Google Ads / CPC",
  social: "Sosyal Medya",
  referral: "Yönlendirme",
  email: "E-posta",
  other: "Diğer",
};
