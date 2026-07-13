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
  "dueren",
  "juelich",
  "geilenkirchen",
  "heinsberg",
  "erkelenz",
  "monschau",
] as const;

export const INTENT_TYPES = [
  "fensterputzer",
  "fenster-putzen",
  "glasreinigung",
  "fensterreiniger",
  "fensterreinigung-preis",
  "fensterreinigung-kosten",
  "fensterreinigung-firma",
  "professionelle-fensterreinigung",
  "gebaeudereinigung",
  "solaranlagen-reinigung",
  "glasfassaden-reinigung",
  "schaufenster-reinigung",
  "wintergarten-reinigung",
  "hausmeister-fenster",
  "wartungsvertrag-fenster",
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
  "fenster-putzen": "Fenster putzen",
  glasreinigung: "Glasreinigung",
  fensterreiniger: "Fensterreiniger",
  "fensterreinigung-preis": "Fensterreinigung Preis",
  "fensterreinigung-kosten": "Fensterreinigung Kosten",
  "fensterreinigung-firma": "Fensterreinigung Firma",
  gebaeudereinigung: "Gebäudereinigung Fenster",
  "professionelle-fensterreinigung": "Professionelle Fensterreinigung",
  "solaranlagen-reinigung": "Solaranlagen-Reinigung",
  "glasfassaden-reinigung": "Glasfassaden-Reinigung",
  "schaufenster-reinigung": "Schaufenster-Reinigung",
  "wintergarten-reinigung": "Wintergarten-Reinigung",
  "hausmeister-fenster": "Hausmeister Fenster",
  "wartungsvertrag-fenster": "Wartungsvertrag Fenster",
  geschenk: "Fensterreinigung Geschenk",
};

export const INTENT_TYPE_HINTS: Record<IntentType, string> = {
  fensterputzer: "Der wirklich kommt",
  "fenster-putzen": "Selbst oder Profi?",
  glasreinigung: "Streifenfrei & sicher",
  fensterreiniger: "Lokal aus Baesweiler",
  "fensterreinigung-preis": "Festpreis in 24h",
  "fensterreinigung-kosten": "Transparent kalkuliert",
  "fensterreinigung-firma": "Versichert & regional",
  gebaeudereinigung: "Gewerbe & MFH",
  "professionelle-fensterreinigung": "Versichert · Festpreis",
  "solaranlagen-reinigung": "PV ab 99 €",
  "glasfassaden-reinigung": "Gewerbe & Büro",
  "schaufenster-reinigung": "Laden & Praxis",
  "wintergarten-reinigung": "Wintergarten & Veranda",
  "hausmeister-fenster": "Hausverwaltung",
  "wartungsvertrag-fenster": "Ab 59 €/Monat",
  geschenk: "Zeit statt Zeug",
};

export function getAllIntentSlugs(): IntentSlug[] {
  return INTENT_TYPES.flatMap((type) =>
    LOCATION_SLUGS.map((city) => `${type}-${city}` as IntentSlug),
  );
}

export function parseIntentSlug(slug: string): { type: IntentType; citySlug: LocationSlug } | null {
  const sorted = [...INTENT_TYPES].sort((a, b) => b.length - a.length);
  for (const type of sorted) {
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
    { source: `/fenster-putzen-${city}`, destination: `/intent/fenster-putzen-${city}` },
    { source: `/fensterputzen-${city}`, destination: `/intent/fenster-putzen-${city}` },
    { source: `/fensterreinigung-in-${city}`, destination: `/locations/${city}` },
    { source: `/fensterreinigung-gewerbe-${city}`, destination: `/fensterreinigung/gewerbe` },
    { source: `/fensterreinigung-preis-${city}`, destination: `/intent/fensterreinigung-preis-${city}` },
    { source: `/fensterreinigung-kosten-${city}`, destination: `/intent/fensterreinigung-kosten-${city}` },
    { source: `/solaranlagen-reinigung-${city}`, destination: `/intent/solaranlagen-reinigung-${city}` },
    { source: `/photovoltaik-reinigung-${city}`, destination: `/intent/solaranlagen-reinigung-${city}` },
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

/** Fenster keyword aliases → hub, intent or ratgeber */
export function getFensterSeoRewrites() {
  return [
    { source: "/fensterreinigung-preise", destination: "/ratgeber/was-kostet-fensterreinigung" },
    { source: "/fensterreinigung-kosten", destination: "/ratgeber/was-kostet-fensterreinigung" },
    { source: "/fensterputzer", destination: "/fensterreinigung" },
    { source: "/glasreinigung", destination: "/fensterreinigung" },
    { source: "/fenster-putzen", destination: "/fensterreinigung" },
    { source: "/fenster-reinigen", destination: "/fensterreinigung" },
    { source: "/photovoltaik-reinigung", destination: "/fensterreinigung/solar" },
    { source: "/pv-anlage-reinigen", destination: "/fensterreinigung/solar" },
    { source: "/glasfassade-reinigung", destination: "/fensterreinigung/fassade" },
    { source: "/schaufenster-putzen", destination: "/fensterreinigung/gewerbe" },
    { source: "/wintergarten-putzen", destination: "/fensterreinigung/privat" },
    { source: "/wartungsvertrag-fensterreinigung", destination: "/fensterreinigung/wartung" },
  ];
}
