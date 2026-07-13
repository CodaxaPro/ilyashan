import { siteConfig } from "./config";
import { EXTENDED_INTENT_BUILDERS } from "./intent-builders-extended";
import {
  assembleIntentPage,
  isHome,
  SHARED_QUOTES,
  travelFrom,
  TRUST,
  type BuiltIntentPage,
  type LocationContext,
} from "./intent-shared";
import type { IntentType } from "./seo-config";

export type { BuiltIntentPage } from "./intent-shared";

function buildFensterputzer(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const home = isHome(loc.slug);
  return assembleIntentPage("fensterputzer", loc, {
    seo: {
      title: `Fensterputzer ${loc.city} | Streifenfrei · Festpreis — Ilyashan`,
      description: home
        ? `Fensterputzer Baesweiler: Ansaessig am Kueckstr. 29, ab 49 €, kein Anfahrtszuschlag. Der kommt wirklich — ${siteConfig.business.rating}★.`
        : `Fensterputzer nahe ${loc.city}: ${travelFrom(loc)}. Streifenfrei, versichert, Festpreis in 24h. Ilyashan Baesweiler.`,
    },
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
    emotions: {
      eyebrow: "Warum Ilyashan",
      headline: `Fensterputzer ${loc.city}`,
      items: [
        { word: "Klarheit", headline: "Kristallklare Scheiben", text: `Streifenfrei in ${loc.city} — garantiert.` },
        { word: "Vertrauen", headline: "Der kommt wirklich", text: "Ansässig in Baesweiler — kein Subunternehmer." },
        { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: "Festpreis gilt — ohne versteckte Fahrtkosten." },
        { word: "Präzision", headline: "Profi-Technik", text: "Rahmen, Falz, Solar — alles aus einer Hand." },
        { word: "Zeit", headline: "Mehr Zeit für Sie", text: "Leiter, Eimer, Frust — übernehmen wir." },
        { word: "Wertschätzung", headline: `${siteConfig.business.customers} Kunden`, text: `${siteConfig.business.rating}★ bei Google.` },
      ],
    },
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
      { q: "Was kostet ein Fensterputzer?", a: "Privat ab 49 €. Live-Schätzung im Wizard." },
      { q: "Versichert?", a: "Ja — Betriebshaftpflicht inklusive." },
      { q: "Kommt wirklich jemand?", a: "Ja — festes Team aus Baesweiler, keine Vermittler." },
    ],
    closing: {
      headline: `Fensterputzer ${loc.city} — jetzt Preis berechnen.`,
      text: "Streifenfrei, versichert, fair — Ilyashan Fensterreinigung.",
      cta: "Preis jetzt berechnen",
    },
  });
}

function buildGlasreinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  return assembleIntentPage("glasreinigung", loc, {
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
    emotions: {
      eyebrow: "Glasreinigung",
      headline: `Sicher & streifenfrei in ${loc.city}`,
      items: [
        { word: "Material", headline: "Glas schonen", text: "Keine Kratzer — richtige Technik & Mittel." },
        { word: "Solar", headline: "PV ohne Risiko", text: "Module materialschonend — mehr Ertrag." },
        { word: "Höhe", headline: "Sicher arbeiten", text: "Versichertes Team statt Leiter zu Hause." },
        { word: "Streifen", headline: "Null Schlieren", text: "Profis sehen, was Amateure übersehen." },
        { word: "Kombi", headline: "Alles aus einer Hand", text: "Fenster, Rahmen, Solar in einem Termin." },
        { word: "Fair", headline: "Festpreis", text: "Wizard + Angebot in 24h." },
      ],
    },
    localProof: { eyebrow: "Glas & Fenster", headline: "Kunden mit Solar & Vitrinen", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Glas-Service",
      headline: "Glasreinigung — Ablauf",
      steps: [
        { num: "01", title: "Glasflächen erfassen", text: "Fenster, Vitrine, Module — im Wizard." },
        { num: "02", title: "Festpreis", text: "Schriftlich in 24 Stunden." },
        { num: "03", title: "Materials schonend", text: "Technik passend zum Glas." },
        { num: "04", title: "Klarer Durchblick", text: "Streifenfrei — innen und außen." },
      ],
    },
    faq: [
      { q: `Glasreinigung ${loc.city} — auch Solar?`, a: "Ja — ab 99 €, materialschonend." },
      { q: "Schaufenster?", a: "Ja — Gewerbe, auch vor Öffnungszeiten." },
      { q: "Innen & außen?", a: "Ja — beidseitig auf Wunsch." },
      { q: "Anfahrt?", a: `${travelFrom(loc)}. Kein Anfahrtszuschlag.` },
    ],
    closing: {
      headline: `Glasreinigung ${loc.city} — Preis jetzt berechnen.`,
      text: "Fenster, Vitrine, Solar — streifenfrei.",
      cta: "Preis jetzt berechnen",
    },
  });
}

function buildFensterreiniger(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const home = isHome(loc.slug);
  return assembleIntentPage("fensterreiniger", loc, {
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
    essence: {
      eyebrow: "Regional statt anonym",
      headline: "Ein Fensterreiniger, den Sie wiedererkennen.",
      paragraphs: [
        `Wer „Fensterreiniger ${loc.city}" sucht, will oft eines: dieselben Leute, dieselbe Qualität — nicht jedes Mal ein neues Gesicht.`,
        `Ilyashan arbeitet mit festen Teams aus Baesweiler — kurze Wege, schnelle Reaktion, ${siteConfig.business.rating}★.`,
        home
          ? "Kückstr. 29 — wenn Sie uns brauchen, sind wir wirklich da."
          : `${travelFrom(loc)}. Festpreis vorab — kein Anfahrtszuschlag.`,
      ],
    },
    emotions: {
      eyebrow: "Nähe",
      headline: `Fensterreiniger für ${loc.city}`,
      items: [
        { word: "Regional", headline: "Aus Baesweiler", text: "Keine Fernfahrt — Sie sind Stammgebiet." },
        { word: "Kontinuität", headline: "Gleiches Team", text: "Kennt Ihre Fenster beim nächsten Mal." },
        { word: "Erreichbar", headline: "Telefon & Mail", text: siteConfig.contact.phoneDisplay },
        { word: "Termine", headline: "Pünktlich", text: "Wir kommen, wenn wir es sagen." },
        { word: "Preis", headline: "Transparent", text: "Wizard + Festpreis in 24h." },
        { word: "Vertrauen", headline: "Versichert", text: "Betriebshaftpflicht inklusive." },
      ],
    },
    localProof: { eyebrow: "Stammkunden", headline: "Wiederbucher aus der Region", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Ihr Reiniger",
      headline: "Fensterreiniger — langfristig",
      steps: [
        { num: "01", title: "Kennenlernen", text: "Erster Auftrag — Wizard & Angebot." },
        { num: "02", title: "Reinigung", text: "Streifenfrei, pünktlich." },
        { num: "03", title: "Wiederholung", text: "Gleiches Team — auf Wunsch Turnus." },
        { num: "04", title: "Wartung", text: "Vertrag ab 59 €/Monat möglich." },
      ],
    },
    faq: [
      { q: `Fensterreiniger ${loc.city} — von wo?`, a: "Baesweiler, Kückstr. 29 — " + travelFrom(loc) + "." },
      { q: "Immer dieselben Leute?", a: "Wir planen feste Teams — Kontinuität wo möglich." },
      { q: "Stammkunde?", a: "Wartungsvertrag oder jährlicher Termin — gerne." },
      { q: "Notfall kurzfristig?", a: "Nach Absprache — z. B. vor Besuch oder Verkauf." },
    ],
    closing: {
      headline: `Fensterreiniger ${loc.city} — jetzt anfragen.`,
      text: "Regional, zuverlässig, streifenfrei.",
      cta: "Preis jetzt berechnen",
    },
  });
}

function buildGebaeudereinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  return assembleIntentPage("gebaeudereinigung", loc, {
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
    emotions: {
      eyebrow: "Gewerbe",
      headline: `Gebäudereinigung ${loc.city}`,
      items: [
        { word: "Image", headline: "Saubere Fassade", text: `Gewerbe in ${loc.city} — erster Eindruck zählt.` },
        { word: "Planbarkeit", headline: "Feste Termine", text: "Auch außerhalb der Öffnungszeiten möglich." },
        { word: "Vertrauen", headline: "Versichert", text: "Betriebshaftpflicht für Büro, Praxis, Laden." },
        { word: "Fairness", headline: "Transparente Preise", text: "Festpreis-Angebot in 24 Stunden." },
        { word: "Präzision", headline: "Streifenfrei", text: "Professionelle Technik — auch bei großen Flächen." },
        { word: "Partnerschaft", headline: "Wartungsvertrag", text: "Ab 59 €/Monat — regelmäßig klare Fenster." },
      ],
    },
    localProof: { eyebrow: "Gewerbe", headline: "Objekte & MFH", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Objekt-Service",
      headline: "Gebäude-Fenster reinigen",
      steps: [
        { num: "01", title: "Objekt beschreiben", text: "Fläche, Nutzung, Zugang." },
        { num: "02", title: "Angebot", text: "Festpreis oder Wartungsvertrag." },
        { num: "03", title: "Terminfenster", text: "Abends / Wochenende möglich." },
        { num: "04", title: "Sauberes Gebäude", text: "Streifenfrei — professionell." },
      ],
    },
    faq: [
      { q: `Gebäudereinigung Fenster ${loc.city}?`, a: "Ja — Büro, Praxis, MFH, Laden." },
      { q: "Wartungsvertrag?", a: "Ab 59 €/Monat — Turnus nach Bedarf." },
      { q: "Hausverwaltung?", a: "Ja — Sammelrechnung möglich." },
      { q: "Versicherung?", a: "Betriebshaftpflicht inklusive." },
    ],
    closing: {
      headline: `Gebäudereinigung Fenster ${loc.city} — Angebot anfordern.`,
      text: "Gewerbe & MFH — streifenfrei, planbar.",
      cta: "Preis jetzt berechnen",
    },
  });
}

function buildProfessionelle(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  return assembleIntentPage("professionelle-fensterreinigung", loc, {
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
    emotions: {
      eyebrow: "Professionell",
      headline: `Qualität in ${loc.city}`,
      items: [
        { word: "Qualität", headline: "Professionell, nicht halbherzig", text: "Streifenfrei garantiert — jedes Mal." },
        { word: "Vertrauen", headline: "Vollversichert", text: `${siteConfig.business.rating}★ · ${siteConfig.business.customers} Kunden` },
        { word: "Transparenz", headline: "Festpreis in 24h", text: "Live-Schätzung im Wizard — keine Überraschungen." },
        { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: `Für ${loc.city} und die gesamte Region.` },
        { word: "Erfahrung", headline: "Seit 2020", text: "Regional verwurzelt in Baesweiler." },
        { word: "Pünktlichkeit", headline: "Termintreue", text: "Wir kommen, wenn wir es sagen." },
      ],
    },
    localProof: { eyebrow: "Qualität", headline: "Professionelle Standards", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Profi-Standard",
      headline: "Professionell — von Anfrage bis Ergebnis",
      steps: [
        { num: "01", title: "Beratung", text: "Wizard oder direkte Anfrage." },
        { num: "02", title: "Festpreis", text: "Schriftlich in 24h — verbindlich." },
        { num: "03", title: "Profi-Reinigung", text: "Technik, Mittel, Erfahrung." },
        { num: "04", title: "Garantie", text: "Streifenfrei — oder Nachbesserung." },
      ],
    },
    faq: [
      { q: `Was ist professionelle Fensterreinigung?`, a: "Versichertes Team, Profi-Mittel, Festpreis, streifenfreies Ergebnis." },
      { q: `In ${loc.city} verfügbar?`, a: `Ja — ${travelFrom(loc)}, kein Anfahrtszuschlag.` },
      { q: "Unterschied zu Schwarzarbeit?", a: "Versicherung, Rechnung, Haftung — Sie sind abgesichert." },
      { q: "Gewerbe?", a: "Ja — gleiche Qualitätsstandards." },
    ],
    closing: {
      headline: `Professionelle Fensterreinigung ${loc.city} — jetzt starten.`,
      text: "Versichert, transparent, streifenfrei.",
      cta: "Preis jetzt berechnen",
    },
  });
}

function buildGeschenk(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  return assembleIntentPage("geschenk", loc, {
    seo: {
      title: `Fensterreinigung Geschenk ${loc.city} | Gutschein — Ilyashan`,
      description: `Fensterreinigung verschenken in ${loc.city}: Gutschein für streifenfreie Fenster — Zeit statt Zeug. Sofort online · ab 49 €.`,
    },
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
    emotions: {
      eyebrow: "Geschenk",
      headline: "Zeit schenken",
      items: [
        { word: "Zeit", headline: "Zeit statt Zeug", text: `Ein Gutschein für klare Fenster in ${loc.city} — das bleibt.` },
        { word: "Überraschung", headline: "Unerwartet & unvergessen", text: "Kein Standardgeschenk — echte Entlastung." },
        { word: "Klarheit", headline: "Durchblick schenken", text: "Streifenfreie Fenster — sichtbarer als Blumen." },
        { word: "Vertrauen", headline: "Seriös & versichert", text: "Ilyashan — 4,9★, 500+ Kunden in der Region." },
        { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: "Einlösbar in Baesweiler und Umgebung." },
        { word: "Wertschätzung", headline: "Sie sehen sie", text: "Ein Geschenk, das ankommt — nicht im Schrank landet." },
      ],
    },
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
      { q: "Persönliche Nachricht?", a: "Ja — beim Bestellen im Shop." },
    ],
    closing: {
      headline: `Fensterreinigung Geschenk ${loc.city} — jetzt bestellen.`,
      text: "Zeit und Klarheit verschenken — Gutschein sofort online.",
      cta: "Gutschein bestellen",
    },
  });
}

const CORE_BUILDERS: Record<string, (type: IntentType, loc: LocationContext) => BuiltIntentPage> = {
  fensterputzer: buildFensterputzer,
  glasreinigung: buildGlasreinigung,
  fensterreiniger: buildFensterreiniger,
  gebaeudereinigung: buildGebaeudereinigung,
  "professionelle-fensterreinigung": buildProfessionelle,
  geschenk: buildGeschenk,
};

const ALL_BUILDERS = { ...CORE_BUILDERS, ...EXTENDED_INTENT_BUILDERS } as Record<
  IntentType,
  (type: IntentType, loc: LocationContext) => BuiltIntentPage
>;

export function buildIntentPage(type: IntentType, loc: LocationContext): BuiltIntentPage {
  const builder = ALL_BUILDERS[type];
  if (!builder) throw new Error(`Unknown intent type: ${type}`);
  return builder(type, loc);
}
