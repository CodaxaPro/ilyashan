/** Shared SEO route constants — safe to import from next.config.ts */
export const LOCATION_SLUGS = [
  "baesweiler",
  "aachen",
  "wurselen",
  "alsdorf",
  "ubach-palenberg",
  "herzogenrath",
  "eschweiler",
  "stolberg",
  "roetgen",
  "kornelimuenster",
] as const;

export const INTENT_TYPES = [
  "fensterputzer",
  "glasreinigung",
  "fensterreiniger",
  "gebaeudereinigung",
  "professionelle-fensterreinigung",
  "geschenk",
] as const;

export const PACKAGE_SLUGS = [
  "privat",
  "gewerbe",
  "rahmen",
  "solar",
  "fassade",
  "wartung",
] as const;

export type LocationSlug = (typeof LOCATION_SLUGS)[number];
export type IntentType = (typeof INTENT_TYPES)[number];
export type PackageSlug = (typeof PACKAGE_SLUGS)[number];
export type IntentSlug = `${IntentType}-${LocationSlug}`;

export const INTENT_TYPE_LABELS: Record<IntentType, string> = {
  fensterputzer: "Fensterputzer",
  glasreinigung: "Glasreinigung",
  fensterreiniger: "Fensterreiniger",
  gebaeudereinigung: "Gebäudereinigung Fenster",
  "professionelle-fensterreinigung": "Professionelle Fensterreinigung",
  geschenk: "Fensterreinigung Geschenk",
};

export const INTENT_TYPE_HINTS: Record<IntentType, string> = {
  fensterputzer: "Der wirklich kommt",
  glasreinigung: "Streifenfrei & sicher",
  fensterreiniger: "Lokal aus Baesweiler",
  gebaeudereinigung: "Gewerbe & MFH",
  "professionelle-fensterreinigung": "Versichert · Festpreis",
  geschenk: "Zeit statt Zeug",
};

export function getAllIntentSlugs(): IntentSlug[] {
  return INTENT_TYPES.flatMap((type) =>
    LOCATION_SLUGS.map((city) => `${type}-${city}` as IntentSlug),
  );
}

export function parseIntentSlug(slug: string): { type: IntentType; citySlug: LocationSlug } | null {
  for (const type of INTENT_TYPES) {
    const prefix = `${type}-`;
    if (slug.startsWith(prefix)) {
      const citySlug = slug.slice(prefix.length);
      if ((LOCATION_SLUGS as readonly string[]).includes(citySlug)) {
        return { type, citySlug: citySlug as LocationSlug };
      }
    }
  }
  return null;
}

export function getIntentPath(type: IntentType, citySlug: LocationSlug): string {
  return `/${type}-${citySlug}`;
}

export function getIntentRewrites() {
  return getAllIntentSlugs().map((slug) => ({
    source: `/${slug}`,
    destination: `/intent/${slug}`,
  }));
}

export function getLocationRewrites() {
  return LOCATION_SLUGS.flatMap((city) => [
    { source: `/fensterreinigung-${city}`, destination: `/locations/${city}` },
    { source: `/fenster-putzen-${city}`, destination: `/locations/${city}` },
    { source: `/fensterputzen-${city}`, destination: `/locations/${city}` },
    { source: `/fensterreinigung-in-${city}`, destination: `/locations/${city}` },
    { source: `/fensterreinigung-gewerbe-${city}`, destination: `/fensterreinigung/gewerbe` },
  ]);
}

/** SEO alias URLs for Gutschein keywords → canonical pages */
export function getGiftSeoRewrites() {
  const geschenkCity = LOCATION_SLUGS.map((city) => ({
    source: `/fensterreinigung-geschenk-${city}`,
    destination: `/intent/geschenk-${city}`,
  }));

  const aliases: { source: string; destination: string }[] = [
    { source: "/fensterreinigung-gutschein", destination: "/gutschein/fensterreinigung" },
    { source: "/reinigungsgutschein", destination: "/gutschein" },
    { source: "/geschenkgutschein", destination: "/gutschein" },
    { source: "/geschenkgutscheine", destination: "/gutschein" },
    { source: "/gutschein-online", destination: "/gutschein/online" },
    { source: "/gutschein-online-kaufen", destination: "/gutschein/online" },
    { source: "/gutschein-kaufen", destination: "/gutschein/online" },
    { source: "/gutschein-bestellen", destination: "/gutschein/online" },
    { source: "/e-gutschein", destination: "/gutschein/online" },
    { source: "/digitaler-gutschein", destination: "/gutschein/online" },
    { source: "/online-gutschein", destination: "/gutschein/online" },
    { source: "/pdf-gutschein", destination: "/gutschein/online" },
    { source: "/gutschein-sofort", destination: "/gutschein/last-minute" },
    { source: "/sofort-gutschein", destination: "/gutschein/last-minute" },
    { source: "/fensterputzer-gutschein", destination: "/gutschein/fensterreinigung" },
    { source: "/reinigungsgeschenk", destination: "/gutschein/fensterreinigung-geschenk" },
    { source: "/geschenkidee", destination: "/gutschein/geschenkidee" },
    { source: "/geschenkideen", destination: "/gutschein/geschenkidee" },
    { source: "/zeit-schenken", destination: "/gutschein/zeit-schenken" },
    { source: "/fensterreinigung-geschenk", destination: "/gutschein/fensterreinigung-geschenk" },
    { source: "/geschenk-fuer-mama", destination: "/gutschein/fuer-mama" },
    { source: "/geschenk-fuer-papa", destination: "/gutschein/fuer-papa" },
    { source: "/geschenk-fuer-oma", destination: "/gutschein/fuer-oma" },
    { source: "/geschenk-fuer-opa", destination: "/gutschein/fuer-opa" },
    { source: "/geschenk-fuer-freund", destination: "/gutschein/fuer-freund" },
    { source: "/luxus-geschenk", destination: "/gutschein/premium" },
    { source: "/premium-geschenk", destination: "/gutschein/premium" },
    { source: "/erlebnisgutschein", destination: "/gutschein/fensterreinigung-geschenk" },
    ...geschenkCity,
  ];

  return aliases;
}

/** Fenster keyword aliases → hub or ratgeber */
export function getFensterSeoRewrites() {
  return [
    { source: "/fensterreinigung-preise", destination: "/ratgeber/was-kostet-fensterreinigung" },
    { source: "/fensterreinigung-kosten", destination: "/ratgeber/was-kostet-fensterreinigung" },
    { source: "/fensterputzer", destination: "/fensterreinigung" },
    { source: "/glasreinigung", destination: "/fensterreinigung" },
  ];
}
