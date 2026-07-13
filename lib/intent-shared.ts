import { siteConfig } from "./config";
import type { LocationMeta } from "./location-data";
import type { LocationSlug } from "./seo-config";

export type EmotionItem = { word: string; headline: string; text: string };
export type JourneyStep = { num: string; title: string; text: string };
export type FaqItem = { q: string; a: string };
export type QuoteItem = { text: string; name: string; location: string };

export type BuiltIntentPage = {
  slug: string;
  path: string;
  seo: { title: string; description: string };
  city: string;
  region: string;
  distance: string;
  nearby: string[];
  hero: { eyebrow: string; headline: string; subline: string; trust: string };
  essence: { eyebrow: string; headline: string; paragraphs: string[] };
  emotions: { eyebrow: string; headline: string; items: EmotionItem[] };
  localProof: {
    eyebrow: string;
    headline: string;
    quotes: QuoteItem[];
  };
  journey: { eyebrow: string; headline: string; steps: JourneyStep[] };
  faq: FaqItem[];
  closing: { headline: string; text: string; cta: string };
};

export type LocationContext = Pick<LocationMeta, "slug" | "city" | "region" | "distance" | "nearby">;

export const TRUST = `${siteConfig.business.rating}★ · Versichert · Kein Anfahrtszuschlag`;

export function isHome(slug: LocationSlug): boolean {
  return slug === "baesweiler";
}

export function travelFrom(loc: LocationContext): string {
  return isHome(loc.slug) ? "direkt vor Ort, Kückstr. 29" : loc.distance;
}

export const SHARED_QUOTES: QuoteItem[] = [
  { text: siteConfig.testimonials[0].text.slice(0, 120) + "…", name: "Cengiz A.", location: "Baesweiler" },
  { text: "Alles perfekt – pünktlich, freundlich, professionell, gründlich.", name: "Markos D.", location: "Region Aachen" },
];

export function assembleIntentPage(
  type: string,
  loc: LocationContext,
  parts: Omit<BuiltIntentPage, "slug" | "path" | "city" | "region" | "distance" | "nearby">,
): BuiltIntentPage {
  return {
    slug: `${type}-${loc.slug}`,
    path: `/${type}-${loc.slug}`,
    city: loc.city,
    region: loc.region,
    distance: loc.distance,
    nearby: loc.nearby,
    ...parts,
  };
}
