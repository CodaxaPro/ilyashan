import fensterreinigungHub from "../content/fensterreinigung.json";
import giftHub from "../content/gift/hub.json";
import packageFassade from "../content/packages/fassade.json";
import packageGewerbe from "../content/packages/gewerbe.json";
import packagePrivat from "../content/packages/privat.json";
import packageRahmen from "../content/packages/rahmen.json";
import packageSolar from "../content/packages/solar.json";
import packageWartung from "../content/packages/wartung.json";

import { buildGiftPage, BUILT_GIFT_SLUGS } from "./gift-builders";
import { buildGuideHub, buildGuidePage, getAllGuidePages, GUIDE_SLUGS } from "./guide-builders";
import { buildIntentPage } from "./intent-builders";
import { buildLocationPage } from "./location-builders";
import { getLocationMeta } from "./location-data";
import { getStaticGiftPage, STATIC_GIFT_SLUGS } from "./static-gift-content";
import {
  getAllIntentSlugs,
  INTENT_TYPE_HINTS,
  INTENT_TYPE_LABELS,
  INTENT_TYPES,
  PACKAGE_SLUGS,
  parseIntentSlug,
  type IntentSlug,
  type LocationSlug,
  LOCATION_SLUGS,
} from "./seo-config";

export {
  getAllIntentSlugs,
  INTENT_TYPES,
  INTENT_TYPE_LABELS,
  INTENT_TYPE_HINTS,
  LOCATION_SLUGS,
  PACKAGE_SLUGS,
  type IntentSlug,
  type IntentType,
  type LocationSlug,
} from "./seo-config";
export { GUIDE_SLUGS } from "./guide-builders";

export const INTENT_SLUGS = getAllIntentSlugs();

export type EmotionItem = {
  word: string;
  headline: string;
  text: string;
};

export type JourneyStep = {
  num: string;
  title: string;
  text: string;
};

export type GiftPageContent = {
  slug: string;
  path: string;
  seo: { title: string; description: string };
  hero: { eyebrow: string; headline: string; subline: string; trust: string };
  essence: { eyebrow: string; headline: string; paragraphs: string[] };
  emotions: { eyebrow: string; headline: string; items: EmotionItem[] };
  recipients?: { eyebrow: string; headline: string; items: { title: string; text: string }[] };
  occasions?: {
    eyebrow: string;
    headline: string;
    intro: string;
    items: { slug: string; label: string; hint: string }[];
  };
  journey: { eyebrow: string; headline: string; steps: JourneyStep[] };
  faq: { q: string; a: string }[];
  closing: { headline: string; text: string; cta: string };
};

export type LocationPageContent = {
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
    quotes: { text: string; name: string; location: string }[];
  };
  journey: { eyebrow: string; headline: string; steps: JourneyStep[] };
  faq: { q: string; a: string }[];
  closing: { headline: string; text: string; cta: string };
};

export type PackagePageContent = {
  slug: string;
  path: string;
  serviceId: string;
  priceFrom: string;
  seo: { title: string; description: string };
  hero: { eyebrow: string; headline: string; subline: string; trust: string };
  essence: { eyebrow: string; headline: string; paragraphs: string[] };
  emotions: { eyebrow: string; headline: string; items: EmotionItem[] };
  includes: { eyebrow: string; headline: string; items: string[] };
  forWhom: { eyebrow: string; headline: string; items: { title: string; text: string }[] };
  journey: { eyebrow: string; headline: string; steps: JourneyStep[] };
  faq: { q: string; a: string }[];
  closing: { headline: string; text: string; cta: string };
};

export type FensterreinigungHubContent = {
  slug: string;
  path: string;
  seo: { title: string; description: string };
  hero: { eyebrow: string; headline: string; subline: string; trust: string };
  pain: { eyebrow: string; headline: string; paragraphs: string[]; closing: string };
  promise: { eyebrow: string; headline: string; text: string };
  stats: { value: string; label: string }[];
  emotions: { eyebrow: string; headline: string; items: EmotionItem[] };
  services: string[];
  journey: { eyebrow: string; headline: string; steps: JourneyStep[] };
  faq: { q: string; a: string }[];
  closing: { headline: string; text: string; cta: string };
};

export type GuidePageContent = import("./guide-builders").GuidePageContent;
export type GuideHubContent = import("./guide-builders").GuideHubContent;

export const GIFT_SLUGS = [...STATIC_GIFT_SLUGS, ...BUILT_GIFT_SLUGS] as const;
export type GiftSlug = (typeof GIFT_SLUGS)[number];
export type StaticGiftSlug = (typeof STATIC_GIFT_SLUGS)[number];
export type PackageSlug = (typeof PACKAGE_SLUGS)[number];
export type GuideSlug = (typeof GUIDE_SLUGS)[number];

const packagePages: Record<PackageSlug, PackagePageContent> = {
  privat: packagePrivat as PackagePageContent,
  gewerbe: packageGewerbe as PackagePageContent,
  rahmen: packageRahmen as PackagePageContent,
  solar: packageSolar as PackagePageContent,
  fassade: packageFassade as PackagePageContent,
  wartung: packageWartung as PackagePageContent,
};

export function getFensterreinigungHub(): FensterreinigungHubContent {
  return fensterreinigungHub as FensterreinigungHubContent;
}

export function getGiftHub(): GiftPageContent {
  return giftHub as GiftPageContent;
}

export function getGiftPage(slug: string): GiftPageContent | null {
  const staticPage = getStaticGiftPage(slug);
  if (staticPage) return staticPage as GiftPageContent;
  const built = buildGiftPage(slug);
  return built ? (built as GiftPageContent) : null;
}

export function getAllGiftPages(): GiftPageContent[] {
  return GIFT_SLUGS.map((slug) => getGiftPage(slug)!);
}

export function getPackagePage(slug: string): PackagePageContent | null {
  if (!(slug in packagePages)) return null;
  return packagePages[slug as PackageSlug];
}

export function getAllPackagePages(): PackagePageContent[] {
  return PACKAGE_SLUGS.map((slug) => packagePages[slug]);
}

export function getLocationPage(slug: string): LocationPageContent | null {
  if (!(LOCATION_SLUGS as readonly string[]).includes(slug)) return null;
  return buildLocationPage(slug as LocationSlug) as LocationPageContent;
}

export function getAllLocationPages(): LocationPageContent[] {
  return LOCATION_SLUGS.map((slug) => buildLocationPage(slug) as LocationPageContent);
}

export function getGuideHub(): GuideHubContent {
  return buildGuideHub();
}

export function getGuidePage(slug: string): GuidePageContent | null {
  return buildGuidePage(slug);
}

export { getAllGuidePages };

export function getIntentPage(slug: string): LocationPageContent | null {
  const parsed = parseIntentSlug(slug);
  if (!parsed) return null;
  const meta = getLocationMeta(parsed.citySlug);
  return buildIntentPage(parsed.type, {
    slug: meta.slug,
    city: meta.city,
    region: meta.region,
    distance: meta.distance,
    nearby: meta.nearby,
  }) as LocationPageContent;
}

export function getAllIntentPages(): LocationPageContent[] {
  return getAllIntentSlugs().map((slug) => getIntentPage(slug)!);
}

function cityLabel(slug: LocationSlug): string {
  return getLocationMeta(slug).city;
}

export const INTENT_SEO_LINKS = getAllIntentSlugs().map((slug) => {
  const parsed = parseIntentSlug(slug)!;
  return {
    slug,
    path: `/${slug}`,
    label: `${INTENT_TYPE_LABELS[parsed.type]} ${cityLabel(parsed.citySlug)}`,
    type: parsed.type,
    citySlug: parsed.citySlug,
  };
});

export const INTENT_BY_TYPE = INTENT_TYPES.map((type) => ({
  type,
  label: INTENT_TYPE_LABELS[type],
  hint: INTENT_TYPE_HINTS[type],
  links: LOCATION_SLUGS.map((citySlug) => ({
    slug: `${type}-${citySlug}` as IntentSlug,
    path: `/${type}-${citySlug}`,
    label: cityLabel(citySlug),
    citySlug,
  })),
}));

export type RelatedLink = { href: string; label: string; hint: string };

export function getLocationRelatedLinks(slug: LocationSlug): RelatedLink[] {
  const city = cityLabel(slug);
  const cityIntents: RelatedLink[] = INTENT_TYPES.map((type) => ({
    href: `/${type}-${slug}`,
    label: `${INTENT_TYPE_LABELS[type]} ${city}`,
    hint: INTENT_TYPE_HINTS[type],
  }));

  const regional: RelatedLink[] = [
    { href: "/ratgeber/was-kostet-fensterreinigung", label: "Was kostet Fensterreinigung?", hint: "Preise & Kosten" },
    { href: "/gutschein", label: "Gutschein verschenken", hint: "Zeit schenken" },
    { href: "/fensterreinigung", label: "Alle Leistungen", hint: "Hub" },
  ];

  return [...cityIntents, ...regional];
}

export function getIntentRelatedLinks(slug: IntentSlug): RelatedLink[] {
  const parsed = parseIntentSlug(slug);
  if (!parsed) {
    return [
      { href: "/fensterreinigung", label: "Fensterreinigung", hint: "Leistungen" },
      { href: "/gutschein", label: "Gutschein", hint: "Schenken" },
    ];
  }

  const { type, citySlug } = parsed;
  const city = cityLabel(citySlug);
  const otherTypes = INTENT_TYPES.filter((t) => t !== type);

  const sameCity: RelatedLink[] = [
    { href: `/fensterreinigung-${citySlug}`, label: `Fensterreinigung ${city}`, hint: "Stadtseite" },
    ...otherTypes.map((t) => ({
      href: `/${t}-${citySlug}`,
      label: `${INTENT_TYPE_LABELS[t]} ${city}`,
      hint: INTENT_TYPE_HINTS[t],
    })),
  ];

  const extras: RelatedLink[] =
    type === "geschenk"
      ? [
          { href: "/gutschein", label: "Gutschein Hub", hint: "Alle Anlässe" },
          { href: "/ratgeber/gutschein-fensterreinigung-tipps", label: "Gutschein Tipps", hint: "Ratgeber" },
        ]
      : [{ href: "/ratgeber/was-kostet-fensterreinigung", label: "Preise", hint: "Ratgeber" }];

  return [...sameCity, ...extras];
}

export const LOCAL_SEO_LINKS = LOCATION_SLUGS.map((slug) => ({
  slug,
  label: cityLabel(slug),
}));

export const TOP_GUIDE_LINKS = [
  { slug: "was-kostet-fensterreinigung", label: "Was kostet Fensterreinigung?" },
  { slug: "streifenfreie-fenster-tipps", label: "Streifenfreie Fenster" },
  { slug: "fensterreinigung-winter", label: "Fensterreinigung Winter" },
  { slug: "fensterreinigung-gewerbe-tipps", label: "Gewerbe Tipps" },
  { slug: "solaranlage-reinigung-guide", label: "Solar reinigen" },
] as const;

export const TOP_GIFT_LINKS = [
  { slug: "fensterreinigung-geschenk", label: "Fensterreinigung Geschenk" },
  { slug: "muttertag", label: "Muttertag" },
  { slug: "weihnachten", label: "Weihnachten" },
  { slug: "online", label: "Gutschein online" },
  { slug: "geburtstag", label: "Geburtstag" },
] as const;
