/** Infer tracking context from a landing page slug */
import { INTENT_TYPES } from "./seo-config";

export type TrackingChannel =
  | "home"
  | "intent"
  | "location"
  | "gift"
  | "guide"
  | "package"
  | "fensterreinigung"
  | "floating"
  | "header"
  | "site";

export type TrackingContext = {
  channel: TrackingChannel;
  slug?: string;
};

export function withUtm(baseUrl: string, ctx?: TrackingContext): string {
  if (!ctx) return baseUrl;

  try {
    const url = new URL(baseUrl, "https://ilyashan.de");
    url.searchParams.set("utm_source", "ilyashan.de");
    url.searchParams.set("utm_medium", ctx.channel);
    url.searchParams.set("utm_campaign", ctx.slug ?? ctx.channel);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function getAngebotUrl(ctx?: TrackingContext): string {
  return withUtm("/de/angebot", ctx);
}

export function getGutscheinUrl(ctx?: TrackingContext): string {
  return withUtm("https://treuepay.de/ilyashan/gutschein", ctx);
}

export function trackingFromPageSlug(slug: string): TrackingContext {
  const sorted = [...INTENT_TYPES].sort((a, b) => b.length - a.length);
  const intentPrefixes = sorted.map((t) => `${t}-`);
  if (intentPrefixes.some((p) => slug.startsWith(p))) {
    return { channel: "intent", slug };
  }
  return { channel: "location", slug };
}
