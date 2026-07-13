import { siteConfig } from "./config";
import type { LocationMeta } from "./location-data";
import type { IntentType, LocationSlug } from "./seo-config";

type EmotionItem = { word: string; headline: string; text: string };
type JourneyStep = { num: string; title: string; text: string };

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
    quotes: { text: string; name: string; location: string }[];
  };
  journey: { eyebrow: string; headline: string; steps: JourneyStep[] };
  faq: { q: string; a: string }[];
  closing: { headline: string; text: string; cta: string };
};

type LocationContext = Pick<LocationMeta, "slug" | "city" | "region" | "distance" | "nearby">;

const TRUST = `${siteConfig.business.rating}★ · Versichert · Kein Anfahrtszuschlag`;

function isHome(slug: LocationSlug): boolean {
  return slug === "baesweiler";
}

function travelFrom(loc: LocationContext): string {
  return isHome(loc.slug) ? "direkt vor Ort, Kückstr. 29" : loc.distance;
}

const SHARED_QUOTES = [
  { text: siteConfig.testimonials[0].text.slice(0, 120) + "…", name: "Cengiz A.", location: "Baesweiler" },
  { text: "Alles perfekt – pünktlich, freundlich, professionell, gründlich.", name: "Markos D.", location: "Region Aachen" },
];

function baseEmotions(city: string, theme: "service" | "gift" | "pro" | "commercial"): EmotionItem[] {
  if (theme === "gift") {
    return [
      { word: "Zeit", headline: "Zeit statt Zeug", text: `Ein Gutschein für klare Fenster in ${city} — das bleibt.` },
      { word: "Überraschung", headline: "Unerwartet & unvergessen", text: "Kein Standardgeschenk — echte Entlastung." },
      { word: "Klarheit", headline: "Durchblick schenken", text: "Streifenfreie Fenster — sichtbarer als Blumen." },
      { word: "Vertrauen", headline: "Seriös & versichert", text: "Ilyashan — 4,9★, 500+ Kunden in der Region." },
      { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: "Einlösbar in Baesweiler und Umgebung." },
      { word: "Wertschätzung", headline: "Sie sehen sie", text: "Ein Geschenk, das ankommt — nicht im Schrank landet." },
    ];
  }
  if (theme === "commercial") {
    return [
      { word: "Image", headline: "Saubere Fassade", text: `Gewerbe in ${city} — erster Eindruck zählt.` },
      { word: "Planbarkeit", headline: "Feste Termine", text: "Auch außerhalb der Öffnungszeiten möglich." },
      { word: "Vertrauen", headline: "Versichert", text: "Betriebshaftpflicht für Büro, Praxis, Laden." },
      { word: "Fairness", headline: "Transparente Preise", text: "Festpreis-Angebot in 24 Stunden." },
      { word: "Präzision", headline: "Streifenfrei", text: "Professionelle Technik — auch bei großen Flächen." },
      { word: "Partnerschaft", headline: "Wartungsvertrag", text: "Ab 59 €/Monat — regelmäßig klare Fenster." },
    ];
  }
  if (theme === "pro") {
    return [
      { word: "Qualität", headline: "Professionell, nicht halbherzig", text: "Streifenfrei garantiert — jedes Mal." },
      { word: "Vertrauen", headline: "Vollversichert", text: `${siteConfig.business.rating}★ · ${siteConfig.business.customers} Kunden` },
      { word: "Transparenz", headline: "Festpreis in 24h", text: "Live-Schätzung im Wizard — keine Überraschungen." },
      { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: `Für ${city} und die gesamte Region.` },
      { word: "Erfahrung", headline: "Seit 2020", text: "Regional verwurzelt in Baesweiler." },
      { word: "Pünktlichkeit", headline: "Termintreue", text: "Wir kommen, wenn wir es sagen." },
    ];
  }
  return [
    { word: "Klarheit", headline: "Kristallklare Scheiben", text: `Streifenfrei in ${city} — garantiert.` },
    { word: "Vertrauen", headline: "Der kommt wirklich", text: "Ansässig in Baesweiler — kein Subunternehmer." },
    { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: "Festpreis gilt — ohne versteckte Kosten." },
    { word: "Präzision", headline: "Profi-Technik", text: "Rahmen, Falz, Solar — alles aus einer Hand." },
    { word: "Zeit", headline: "Mehr Zeit für Sie", text: "Leiter, Eimer, Frust — übernehmen wir." },
    { word: "Wertschätzung", headline: `${siteConfig.business.customers} Kunden`, text: `${siteConfig.business.rating}★ bei Google.` },
  ];
}

function buildFensterputzer(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const slug = `fensterputzer-${loc.slug}`;
  const home = isHome(loc.slug);
  return {
    slug,
    path: `/${slug}`,
    seo: {
      title: `Fensterputzer ${loc.city} | Streifenfrei · Festpreis — Ilyashan`,
      description: home
        ? `Fensterputzer Baesweiler: Ansaessig am Kueckstr. 29, ab 49 €, kein Anfahrtszuschlag. Der kommt wirklich — ${siteConfig.business.rating}★.`
        : `Fensterputzer nahe ${loc.city}: ${travelFrom(loc)}. Streifenfrei, versichert, Festpreis in 24h. Ilyashan Baesweiler.`,
    },
    city: loc.city,
    region: loc.region,
    distance: loc.distance,
    nearby: loc.nearby,
    hero: {
      eyebrow: `Fensterputzer · ${loc.city}`,
      headline: home ? "Fensterputzer, der wirklich kommt." : `Fensterputzer in ${loc.city} — zuverlässig & streifenfrei.`,
      subline: home
        ? "Keine leeren Versprechen — Ilyashan ist ansässig in Baesweiler. Live-Preisschätzung, Festpreis in 24 Stunden."
        : `Sie suchen einen Fensterputzer in ${loc.city}? ${travelFrom(loc)} — pünktlich, versichert, ohne Anfahrtszuschlag.`,
      trust: `${TRUST} · Fensterputzer Baesweiler`,
    },
    essence: {
      eyebrow: "Fensterputzer gesucht?",
      headline: home ? "Der Unterschied: lokal, versichert, fair." : `Fensterputzer ${loc.city} — nicht irgendwer von weit weg.`,
      paragraphs: [
        `„Fensterputzer ${loc.city}" bedeutet für viele: unzuverlässig, teuer, Streifen. Wir machen es anders — ansässig in Baesweiler, ${siteConfig.business.rating}★ bei Google.`,
        "Im Wizard sehen Sie sofort eine Live-Preisschätzung. Nach Ihrer Anfrage: verbindliches Festpreis-Angebot in 24 Stunden — kein Anfahrtszuschlag.",
        home
          ? "Privat ab 49 €, Rahmen & Falz ab 79 €. Über 500 Kunden in der Region vertrauen uns."
          : `Kunden aus ${loc.city} schätzen: pünktlich, freundlich, streifenfrei — ${travelFrom(loc)}.`,
      ],
    },
    emotions: { eyebrow: "Warum Ilyashan", headline: `Fensterputzer ${loc.city}`, items: baseEmotions(loc.city, "service") },
    localProof: { eyebrow: "Stimmen", headline: "Was Kunden sagen", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Ablauf",
      headline: `Fensterputzer ${loc.city} — so läuft's`,
      steps: [
        { num: "01", title: "Preis berechnen", text: "Wizard: Flügel, Etage, Extras — live sichtbar." },
        { num: "02", title: "Festpreis", text: "Verbindliches Angebot in 24 Stunden." },
        { num: "03", title: "Termin", text: home ? "Pünktlich in Baesweiler." : `Reinigung in ${loc.city}.` },
        { num: "04", title: "Streifenfrei", text: "Klare Fenster — garantiert." },
      ],
    },
    faq: [
      { q: `Fensterputzer ${loc.city} — Anfahrt?`, a: `${travelFrom(loc)}. Kein Anfahrtszuschlag.` },
      { q: "Was kostet es?", a: "Privat ab 49 €. Live-Schätzung im Wizard." },
      { q: "Versichert?", a: "Ja — Betriebshaftpflicht inklusive." },
    ],
    closing: {
      headline: `Fensterputzer ${loc.city} — jetzt Preis berechnen.`,
      text: "Streifenfrei, versichert, fair — Ilyashan Fensterreinigung.",
      cta: "Preis jetzt berechnen",
    },
  };
}

function buildGlasreinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const slug = `glasreinigung-${loc.slug}`;
  const page = buildFensterputzer("fensterputzer", loc);
  return {
    ...page,
    slug,
    path: `/${slug}`,
    seo: {
      title: `Glasreinigung ${loc.city} | Streifenfrei & sicher — Ilyashan`,
      description: `Glasreinigung in ${loc.city}: Fenster, Vitrinen, Solar — streifenfrei, versichert. ${travelFrom(loc)}. Ab 49 € · Festpreis in 24h.`,
    },
    hero: {
      eyebrow: `Glasreinigung · ${loc.city}`,
      headline: `Glasreinigung in ${loc.city} — streifenfrei, sicher.`,
      subline: "Fenster, Schaufenster, Solaranlagen — professionelle Glasreinigung mit Festpreis-Garantie.",
      trust: `${TRUST} · Glas & Solar`,
    },
    essence: {
      eyebrow: "Glas reinigen lassen",
      headline: "Mehr als Fenster putzen — Glas braucht Profis.",
      paragraphs: [
        `Glasreinigung in ${loc.city}: Ob Wohnfenster, Vitrine oder PV-Module — wir reinigen streifenfrei und materialschonend.`,
        "Solar ab 99 €, Privat ab 49 €. Live-Preisschätzung online — Festpreis in 24 Stunden.",
        `Kein Anfahrtszuschlag für ${loc.city}. ${siteConfig.business.rating}★ · versichert.`,
      ],
    },
    emotions: { eyebrow: "Glasreinigung", headline: `Sicher & streifenfrei in ${loc.city}`, items: baseEmotions(loc.city, "pro") },
    closing: { ...page.closing, headline: `Glasreinigung ${loc.city} — Preis jetzt berechnen.`, cta: "Preis jetzt berechnen" },
  };
}

function buildFensterreiniger(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const slug = `fensterreiniger-${loc.slug}`;
  const home = isHome(loc.slug);
  const page = buildFensterputzer("fensterputzer", loc);
  return {
    ...page,
    slug,
    path: `/${slug}`,
    seo: {
      title: `Fensterreiniger ${loc.city} | Lokal aus Baesweiler — Ilyashan`,
      description: `Fensterreiniger nahe ${loc.city}: Ansässig in Baesweiler, ${travelFrom(loc)}. Streifenfrei, ab 49 €, kein Anfahrtszuschlag.`,
    },
    hero: {
      eyebrow: `Fensterreiniger · ${loc.city}`,
      headline: home ? "Ihr Fensterreiniger vor der Haustür." : `Fensterreiniger nahe ${loc.city} — aus Baesweiler.`,
      subline: "Keine anonyme Kette — ein Team, das die Region kennt und Termine hält.",
      trust: `${TRUST} · Regional`,
    },
    closing: { ...page.closing, headline: `Fensterreiniger ${loc.city} — jetzt anfragen.` },
  };
}

function buildGebaeudereinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const slug = `gebaeudereinigung-${loc.slug}`;
  const page = buildFensterputzer("fensterputzer", loc);
  return {
    ...page,
    slug,
    path: `/${slug}`,
    seo: {
      title: `Gebäudereinigung Fenster ${loc.city} | Gewerbe & MFH — Ilyashan`,
      description: `Fenster in ${loc.city} — Gewerbe, Praxis, Mehrfamilienhaus. Flexible Termine, Wartungsvertrag ab 59 €/Monat. Versichert.`,
    },
    hero: {
      eyebrow: `Gebäudereinigung · ${loc.city}`,
      headline: `Fenster in ${loc.city} — Gewerbe & Mehrfamilienhäuser.`,
      subline: "Büro, Praxis, Laden, Hausverwaltung — streifenfreie Fensterreinigung mit Festpreis.",
      trust: `${TRUST} · Gewerbe & Privat`,
    },
    essence: {
      eyebrow: "Gewerbe & Gebäude",
      headline: "Professionelle Fenster für Ihr Objekt.",
      paragraphs: [
        `Gebäudereinigung Fenster in ${loc.city}: Wir reinigen Büros, Praxen, Ladenflächen und Mehrfamilienhäuser — auch außerhalb der Öffnungszeiten.`,
        "Wartungsvertrag ab 59 €/Monat für planbare Kosten. Einzelaufträge mit Live-Preisschätzung und Festpreis in 24h.",
        "Versichert, pünktlich, streifenfrei — kein Anfahrtszuschlag in der Region.",
      ],
    },
    emotions: { eyebrow: "Gewerbe", headline: `Gebäudereinigung ${loc.city}`, items: baseEmotions(loc.city, "commercial") },
    closing: { ...page.closing, headline: `Gebäudereinigung Fenster ${loc.city} — Angebot anfordern.`, cta: "Preis jetzt berechnen" },
  };
}

function buildProfessionelle(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const slug = `professionelle-fensterreinigung-${loc.slug}`;
  const page = buildFensterputzer("fensterputzer", loc);
  return {
    ...page,
    slug,
    path: `/${slug}`,
    seo: {
      title: `Professionelle Fensterreinigung ${loc.city} | Versichert · Festpreis — Ilyashan`,
      description: `Professionelle Fensterreinigung ${loc.city}: Streifenfrei garantiert, versichert, Festpreis in 24h. ${siteConfig.business.rating}★ · ${siteConfig.business.customers} Kunden.`,
    },
    hero: {
      eyebrow: `Professionell · ${loc.city}`,
      headline: `Professionelle Fensterreinigung ${loc.city} — versichert, Festpreis.`,
      subline: "Qualität, die man sieht: streifenfrei, pünktlich, transparent kalkuliert.",
      trust: `${TRUST} · Seit ${siteConfig.business.founded}`,
    },
    essence: {
      eyebrow: "Qualität zählt",
      headline: "Professionell heißt: Ergebnis, Versicherung, Fairness.",
      paragraphs: [
        `Professionelle Fensterreinigung in ${loc.city} — nicht halbherzig, nicht mit Streifen. Ilyashan: ${siteConfig.business.rating}★, ${siteConfig.business.customers} Kunden, seit ${siteConfig.business.founded}.`,
        "Live-Preisschätzung im Wizard, verbindliches Festpreis-Angebot in 24 Stunden. Kein Anfahrtszuschlag.",
        "Betriebshaftpflicht inklusive — Ihr Zuhause und Ihre Fenster in sicheren Händen.",
      ],
    },
    emotions: { eyebrow: "Professionell", headline: `Qualität in ${loc.city}`, items: baseEmotions(loc.city, "pro") },
    closing: { ...page.closing, headline: `Professionelle Fensterreinigung ${loc.city} — jetzt starten.` },
  };
}

function buildGeschenk(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const slug = `geschenk-${loc.slug}`;
  return {
    slug,
    path: `/${slug}`,
    seo: {
      title: `Fensterreinigung Geschenk ${loc.city} | Gutschein — Ilyashan`,
      description: `Fensterreinigung verschenken in ${loc.city}: Gutschein für streifenfreie Fenster — Zeit statt Zeug. Sofort online · ab 49 €.`,
    },
    city: loc.city,
    region: loc.region,
    distance: loc.distance,
    nearby: loc.nearby,
    hero: {
      eyebrow: `Geschenk · ${loc.city}`,
      headline: "Kein Ding fürs Regal. Zeit und Klarheit schenken.",
      subline: `Fensterreinigung Gutschein für ${loc.city} — sofort online, Print@Home, einlösbar in Baesweiler und Region.`,
      trust: `${TRUST} · Sofort per E-Mail`,
    },
    essence: {
      eyebrow: "Geschenkidee",
      headline: "Sie schenken Entlastung — nicht noch ein Produkt.",
      paragraphs: [
        "Blumen welken, Schokolade wird gegessen — klare Fenster bleiben als Erleichterung im Gedächtnis.",
        `Ein Fensterreinigung-Gutschein für ${loc.city}: Beschenkte bucht selbst — wir kommen streifenfrei vorbei.`,
        "Online bestellen, sofort per E-Mail — ideal auch last minute.",
      ],
    },
    emotions: { eyebrow: "Geschenk", headline: "Zeit schenken", items: baseEmotions(loc.city, "gift") },
    localProof: { eyebrow: "Stimmen", headline: "Geschenke, die ankommen", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Gutschein schenken",
      headline: "In Minuten bestellt",
      steps: [
        { num: "01", title: "Bestellen", text: "Online — sofort per E-Mail." },
        { num: "02", title: "Verschenken", text: "Print@Home oder digital." },
        { num: "03", title: "Einlösen", text: `Termin in ${loc.city} oder Region.` },
        { num: "04", title: "Freude", text: "Klare Fenster — garantiert." },
      ],
    },
    faq: [
      { q: `Gutschein für ${loc.city}?`, a: `Ja — einlösbar in Baesweiler und Region, kein Anfahrtszuschlag für ${loc.city}.` },
      { q: "Sofort verfügbar?", a: "Ja — ideal auch last minute." },
      { q: "Ab welchem Betrag?", a: "Ab 49 € (Privat) — oder Wunschbetrag im Shop." },
    ],
    closing: {
      headline: `Fensterreinigung Geschenk ${loc.city} — jetzt bestellen.`,
      text: "Zeit und Klarheit verschenken — Gutschein sofort online.",
      cta: "Gutschein bestellen",
    },
  };
}

const BUILDERS: Record<IntentType, (type: IntentType, loc: LocationContext) => BuiltIntentPage> = {
  fensterputzer: buildFensterputzer,
  glasreinigung: buildGlasreinigung,
  fensterreiniger: buildFensterreiniger,
  gebaeudereinigung: buildGebaeudereinigung,
  "professionelle-fensterreinigung": buildProfessionelle,
  geschenk: buildGeschenk,
};

export function buildIntentPage(type: IntentType, loc: LocationContext): BuiltIntentPage {
  return BUILDERS[type](type, loc);
}
