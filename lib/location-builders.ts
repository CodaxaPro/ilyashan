import { siteConfig } from "./config";
import { getLocationMeta } from "./location-data";
import type { LocationSlug } from "./seo-config";

type EmotionItem = { word: string; headline: string; text: string };
type JourneyStep = { num: string; title: string; text: string };

export type BuiltLocationPage = {
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

const TRUST = `${String(siteConfig.business.rating).replace(".", ",")} aus ${siteConfig.business.reviews} Google-Bewertungen · Kein Anfahrtszuschlag`;

function isHome(slug: LocationSlug): boolean {
  return slug === "baesweiler";
}

function defaultEmotions(city: string): EmotionItem[] {
  return [
    {
      word: "Klarheit",
      headline: "Kristallklare Fenster",
      text: `Endlich wieder durchblicken — streifenfrei in ${city} und Umgebung.`,
    },
    {
      word: "Vertrauen",
      headline: "Versichert",
      text: "Die Arbeit ist versichert.",
    },
    {
      word: "Fairness",
      headline: "Kein Anfahrtszuschlag",
      text: "Der vereinbarte Festpreis gilt — ohne versteckte Fahrtkosten.",
    },
    {
      word: "Präzision",
      headline: "Streifenfrei",
      text: "Profi-Technik und Erfahrung.",
    },
    {
      word: "Zeit",
      headline: "Mehr Zeit für Sie",
      text: "Wir erledigen, was Sie aufschieben — pünktlich und zuverlässig.",
    },
    {
      word: "Wertschätzung",
      headline: `${String(siteConfig.business.rating).replace(".", ",")} bei Google`,
      text: `${siteConfig.business.reviews} Bewertungen aus der Region.`,
    },
  ];
}

function defaultQuotes() {
  return siteConfig.testimonials.slice(0, 2).map((review) => ({
    text: review.text,
    name: review.name,
    location: "Google",
  }));
}

export function buildLocationPage(slug: LocationSlug): BuiltLocationPage {
  const meta = getLocationMeta(slug);
  const home = isHome(slug);
  const travel = home ? "direkt vor Ort, Kückstr. 29" : meta.distance;

  return {
    slug,
    path: `/fensterreinigung-${slug}`,
    seo: {
      title: home
        ? `Fensterreinigung Baesweiler | Streifenfrei · Festpreis in 24h`
        : `Fensterreinigung ${meta.city} | Streifenfrei · Kein Anfahrtszuschlag`,
      description: home
        ? `Fensterreinigung in Baesweiler, Kückstr. 29. Ab 49 €, kein Anfahrtszuschlag. Live-Preisschätzung online, Festpreis in 24 Stunden. ${String(siteConfig.business.rating).replace(".", ",")} aus ${siteConfig.business.reviews} Google-Bewertungen.`
        : `Fensterreinigung in ${meta.city}: ${travel}. Ab 49 €, kein Anfahrtszuschlag, Live-Preisschätzung im Rechner, Festpreis in 24 Stunden. ${String(siteConfig.business.rating).replace(".", ",")} aus ${siteConfig.business.reviews} Google-Bewertungen.`,
    },
    city: meta.city,
    region: meta.region,
    distance: meta.distance,
    nearby: meta.nearby,
    hero: {
      eyebrow: `Fensterreinigung · ${meta.city}`,
      // Ads Quality Score: H1 must mirror city+service intent (Neredeyim 5s test)
      headline: home
        ? "Fensterreinigung Baesweiler — klar, fair, streifenfrei."
        : `Fensterreinigung ${meta.city} — klar, fair, streifenfrei.`,
      subline: home
        ? "Ansässig in Baesweiler — Kückstr. 29. Live-Preisschätzung im Wizard, Festpreis in 24 Stunden, versichert und pünktlich."
        : `Professionelle Fensterreinigung nahe ${meta.city}: ${travel}. Transparente Preisschätzung online — verbindliches Festpreis-Angebot in 24 Stunden.`,
      trust: home
        ? `${TRUST} · Kückstr. 29`
        : `${TRUST} · ${meta.distance}`,
    },
    essence: {
      eyebrow: `Fensterreinigung ${meta.city}`,
      headline: home
        ? "Von Nachbarn, nicht von weit weg."
        : `${meta.city} verdient Fensterprofis, die wirklich kommen.`,
      paragraphs: home
        ? [
            "Sie suchen Fensterreinigung in Baesweiler und wollen wissen, wer wirklich kommt — und was es kostet, bevor der Termin steht.",
            "Ilyashan ist hier ansässig: Privatfenster ab 49 €, Rahmen & Falz ab 79 €, Solar ab 99 €. Im Wizard sehen Sie sofort eine Live-Preisschätzung — danach erhalten Sie Ihr verbindliches Festpreis-Angebot innerhalb von 24 Stunden.",
            `${String(siteConfig.business.rating).replace(".", ",")} aus ${siteConfig.business.reviews} Google-Bewertungen. Versichert, ohne Anfahrtszuschlag in Baesweiler und Umgebung.`,
          ]
        : [
            `Sie suchen Fensterreinigung in ${meta.city} und wollen keine Überraschungen: Wer kommt? Was kostet es? Wann ist es fertig?`,
            `Ilyashan ist in Baesweiler ansässig — ${travel}. Privat ab 49 €, Rahmen & Falz ab 79 €, Solar ab 99 €. Live-Preisschätzung im Wizard, Festpreis-Angebot in 24 Stunden — kein Anfahrtszuschlag für ${meta.city}.`,
            `Ob Einfamilienhaus, Wohnung oder Gewerbe: Wir reinigen streifenfrei, pünktlich und versichert — ${String(siteConfig.business.rating).replace(".", ",")} aus ${siteConfig.business.reviews} Google-Bewertungen.`,
          ],
    },
    emotions: {
      eyebrow: "Warum Ilyashan",
      headline: home ? "Sechs Gründe für Fensterreinigung in Baesweiler" : `Sechs Gründe — Fensterreinigung ${meta.city}`,
      items: defaultEmotions(meta.city),
    },
    localProof: {
      eyebrow: "Stimmen aus der Region",
      headline: "Was Kunden sagen",
      quotes: defaultQuotes(),
    },
    journey: {
      eyebrow: "So einfach geht's",
      headline: home ? "Fensterreinigung Baesweiler — in vier Schritten" : `Von ${meta.city} zu klaren Fenstern`,
      steps: [
        {
          num: "01",
          title: "Preis berechnen",
          text: "Im Angebots-Wizard Flügel, Etage und Extras wählen — Preisschätzung live sichtbar.",
        },
        {
          num: "02",
          title: "Festpreis erhalten",
          text: "Anfrage absenden — verbindliches Festpreis-Angebot innerhalb von 24 Stunden.",
        },
        {
          num: "03",
          title: "Reinigung",
          text: home
            ? "Pünktlich in Baesweiler — streifenfrei, versichert, gründlich."
            : `Termin in ${meta.city} — professionell, sauber, ohne Anfahrtszuschlag.`,
        },
        {
          num: "04",
          title: "Klare Fenster",
          text: home ? "Durchblicken und entspannt zurücklehnen." : `Klare Fenster in ${meta.city}.`,
        },
      ],
    },
    faq: [
      {
        q: home ? "Wo genau in Baesweiler?" : `Fensterreinigung ${meta.city} — Anfahrt?`,
        a: home
          ? "Kückstr. 29, 52499 Baesweiler — ansässig vor Ort, kein Anfahrtszuschlag in der gesamten Region."
          : `${travel} von Baesweiler aus. Kein Anfahrtszuschlag für ${meta.city} und Umgebung.`,
      },
      {
        q: "Was kostet Fensterreinigung?",
        a: "Privat ab 49 €, Rahmen & Falz ab 79 €, Solar ab 99 €. Live-Preisschätzung im Wizard — Festpreis-Angebot in 24 Stunden.",
      },
      {
        q: "Fallen Anfahrtskosten an?",
        a: `Nein — für ${meta.city} und alle genannten Gebiete berechnen wir keinen Anfahrtszuschlag.`,
      },
      {
        q: "Sind Sie versichert?",
        a: "Ja. Die Arbeit ist versichert.",
      },
    ],
    closing: {
      headline: home ? "Klare Fenster. Klarer Preis. Jetzt in Baesweiler." : `Klare Fenster in ${meta.city} — jetzt Preis berechnen.`,
      text: home
        ? "Live-Preisschätzung online — Festpreis in 24 Stunden. Streifenfrei."
        : `${travel}. Kein Anfahrtszuschlag — Festpreis in 24 Stunden.`,
      cta: "Preis jetzt berechnen",
    },
  };
}

import { LOCATION_SLUGS } from "./seo-config";

export function buildAllLocationPages(): BuiltLocationPage[] {
  return LOCATION_SLUGS.map((slug) => buildLocationPage(slug));
}
