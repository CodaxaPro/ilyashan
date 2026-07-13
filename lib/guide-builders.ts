import { siteConfig } from "./config";

export const GUIDE_SLUGS = [
  "was-kostet-fensterreinigung",
  "fensterreinigung-selber-machen-vs-profi",
  "streifenfreie-fenster-tipps",
  "fensterreinigung-winter",
  "fensterreinigung-gewerbe-tipps",
  "solaranlage-reinigung-guide",
  "rahmen-falz-warum-wichtig",
  "fensterreinigung-haeufigkeit",
  "fensterreinigung-umzug-einzug",
  "erste-beauftragung-fensterprofi",
  "gutschein-fensterreinigung-tipps",
  "glasfassade-reinigung-sicherheit",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

export type GuidePageContent = {
  slug: string;
  path: string;
  seo: { title: string; description: string };
  hero: { eyebrow: string; headline: string; subline: string };
  sections: { title: string; paragraphs: string[]; bullets?: string[] }[];
  keyTakeaways?: { headline: string; items: string[] };
  relatedLinks: { href: string; label: string; hint: string }[];
  faq: { q: string; a: string }[];
  closing: { headline: string; text: string; cta: string };
};

export type GuideHubContent = {
  slug: string;
  path: string;
  seo: { title: string; description: string };
  hero: { eyebrow: string; headline: string; subline: string };
  articles: {
    eyebrow: string;
    headline: string;
    intro: string;
    items: { slug: string; label: string; hint: string }[];
  };
  closing: { headline: string; text: string; cta: string };
};

const ARTICLE_DEFS: Record<
  GuideSlug,
  {
    title: string;
    description: string;
    headline: string;
    subline: string;
    sections: GuidePageContent["sections"];
    faq: GuidePageContent["faq"];
    related: GuidePageContent["relatedLinks"];
    takeaways?: string[];
  }
> = {
  "was-kostet-fensterreinigung": {
    title: "Was kostet Fensterreinigung? | Preise NRW 2026 — Ilyashan",
    description: "Fensterreinigung Kosten: ab 49 € Privat, Rahmen ab 79 €, Solar ab 99 €. Live-Preisschätzung im Wizard, Festpreis in 24h. Kein Anfahrtszuschlag.",
    headline: "Was kostet Fensterreinigung wirklich?",
    subline: "Transparente Preise für Baesweiler, Aachen und Umgebung — ohne versteckte Kosten.",
    sections: [
      {
        title: "Preisübersicht Ilyashan",
        paragraphs: [
          "Die Kosten hängen von Fensteranzahl, Etage, Verschmutzung und Extras ab. Als Orientierung: Privatfenster ab 49 €, Rahmen & Falz ab 79 €, Solar ab 99 €, Wartungsvertrag ab 59 €/Monat.",
          "Im Angebots-Wizard auf ilyashan.de sehen Sie sofort eine Live-Preisschätzung. Nach Ihrer Anfrage erhalten Sie innerhalb von 24 Stunden ein verbindliches Festpreis-Angebot.",
        ],
        bullets: [
          "Privatfenster: ab 49 € (ca. 8 Fenster, einseitig)",
          "Rahmen & Falz: ab 79 € (beidseitig inkl. Rahmen)",
          "Solaranlagen: ab 99 € (bis ca. 15 Module)",
          "Gewerbe & Fassade: auf Anfrage nach Aufmaß",
        ],
      },
      {
        title: "Kein Anfahrtszuschlag",
        paragraphs: [
          "Für Baesweiler, Aachen (alle Stadtteile), Würselen, Eschweiler und das gesamte Einsatzgebiet berechnen wir keinen Anfahrtszuschlag. Der vereinbarte Festpreis gilt.",
        ],
      },
    ],
    faq: [
      { q: "Ist die Wizard-Schätzung verbindlich?", a: "Nein — sie ist unverbindlich. Das Festpreis-Angebot per E-Mail innerhalb von 24h ist verbindlich." },
      { q: "Gibt es Mindestauftrag?", a: "Ja — Wohnungen ab ca. 49 € Mindestauftrag nach NRW-Marktpreisen." },
    ],
    related: [
      { href: "/fensterreinigung/privat", label: "Privatfenster", hint: "ab 49 €" },
      { href: "/de/angebot", label: "Preis berechnen", hint: "Live-Wizard" },
      { href: "/fensterreinigung-baesweiler", label: "Baesweiler", hint: "Lokal" },
    ],
    takeaways: ["Live-Schätzung im Wizard", "Festpreis in 24h", "Kein Anfahrtszuschlag", "Ab 49 € Privat"],
  },
  "fensterreinigung-selber-machen-vs-profi": {
    title: "Fenster selber putzen vs. Profi | Ratgeber — Ilyashan",
    description: "Selber machen oder Profi? Zeit, Streifen, Sicherheit — ehrlicher Vergleich für Fensterreinigung in der Region Aachen.",
    headline: "Selber putzen oder Profi beauftragen?",
    subline: "Zeit, Ergebnis und Risiko — was wirklich dahintersteckt.",
    sections: [
      {
        title: "Selber machen: versteckte Kosten",
        paragraphs: [
          "Leiter, Reiniger, Lappen, Zeit — und oft Streifen. Bei höheren Etagen kommt Sicherheitsrisiko dazu.",
          "Viele unterschätzen Rahmen, Falz und Fensterbank — dort sammelt sich Schmutz und Schimmel.",
        ],
      },
      {
        title: "Profi: Festpreis und Ergebnis",
        paragraphs: [
          "Ilyashan liefert streifenfreie Ergebnisse, ist versichert und kalkuliert transparent. Live-Preisschätzung online — Festpreis in 24 Stunden.",
        ],
      },
    ],
    faq: [{ q: "Lohnt sich der Profi?", a: "Wenn Zeit, Streifenfreiheit und Sicherheit zählen — ja. Ab 49 € oft günstiger als erwartet." }],
    related: [
      { href: "/ratgeber/was-kostet-fensterreinigung", label: "Preise", hint: "Kosten" },
      { href: "/ratgeber/streifenfreie-fenster-tipps", label: "Streifenfrei", hint: "Tipps" },
    ],
  },
  "streifenfreie-fenster-tipps": {
    title: "Streifenfreie Fenster Tipps | Profi-Geheimnisse — Ilyashan",
    description: "Streifenfreie Fenster: Technik, Reiniger, Wetter — Tipps von Ilyashan Fensterreinigung Baesweiler.",
    headline: "Streifenfreie Fenster — so geht's wirklich",
    subline: "Was Profis anders machen als Haushaltsreiniger.",
    sections: [
      {
        title: "Technik zählt",
        paragraphs: [
          "Profiprodukte, saubere Lappen, richtige Technik von oben nach unten — und Rahmen zuerst.",
          "Bei direkter Sonne trocknet Wasser zu schnell — Streifen sind vorprogrammiert.",
        ],
        bullets: ["Rahmen und Falz zuerst", "Profiprodukte statt Haushaltsmittel", "Bei Bewölkung putzen", "Mikrofasertücher wechseln"],
      },
    ],
    faq: [{ q: "Garantiert Ilyashan streifenfrei?", a: "Ja — streifenfrei garantiert bei jeder Beauftragung." }],
    related: [{ href: "/fensterreinigung", label: "Leistungen", hint: "Hub" }],
  },
  "fensterreinigung-winter": {
    title: "Fensterreinigung im Winter | Ratgeber — Ilyashan",
    description: "Fensterreinigung Winter: ab wann möglich? Frost, Temperatur, Tipps. Ilyashan reinigt bei über -5 °C.",
    headline: "Fensterreinigung im Winter — geht das?",
    subline: "Ja — mit Profis und richtiger Planung.",
    sections: [
      {
        title: "Temperatur und Frost",
        paragraphs: [
          "Bei Ilyashan reinigen wir bei Temperaturen über -5 °C. Unterhalb pausieren wir aus Qualitätsgründen.",
          "Winterreinigung vor Weihnachten oder Einzug ist beliebt — früh buchen lohnt sich.",
        ],
      },
    ],
    faq: [{ q: "Bei Frost?", a: "Unter -5 °C pausieren wir. Darüber: normale Termine möglich." }],
    related: [{ href: "/fensterreinigung-baesweiler", label: "Termin", hint: "Regional" }],
  },
  "fensterreinigung-gewerbe-tipps": {
    title: "Fensterreinigung Gewerbe Tipps | Büro & Praxis — Ilyashan",
    description: "Gewerbefenster reinigen: Termine, Sicherheit, Wartungsvertrag. Tipps für Büro, Praxis, Laden.",
    headline: "Gewerbefenster professionell reinigen",
    subline: "Image, Hygiene und planbare Kosten.",
    sections: [
      {
        title: "Gewerbe braucht Planbarkeit",
        paragraphs: [
          "Außerhalb der Öffnungszeiten, Wartungsvertrag ab 59 €/Monat, versicherte Profis — so halten Büros und Praxen dauerhaft sauber.",
        ],
      },
    ],
    faq: [{ q: "Wartungsvertrag?", a: "Ab 59 €/Monat — regelmäßige Reinigung zum Festpreis." }],
    related: [{ href: "/fensterreinigung/gewerbe", label: "Gewerbe", hint: "Leistung" }],
  },
  "solaranlage-reinigung-guide": {
    title: "Solaranlage reinigen | Guide — Ilyashan",
    description: "Solaranlage Reinigung: Kosten ab 99 €, Ertrag, Sicherheit. Professionelle PV-Reinigung Baesweiler & Aachen.",
    headline: "Solaranlage reinigen — Ertrag sichern",
    subline: "Verschmutzte Module liefern weniger Strom.",
    sections: [
      {
        title: "Warum Solar reinigen?",
        paragraphs: [
          "Pollen, Staub, Vogelkot reduzieren den Ertrag. Professionelle Reinigung ab 99 € — materialschonend und sicher.",
        ],
      },
    ],
    faq: [{ q: "Wie oft?", a: "Je nach Lage 1–2× pro Jahr empfohlen." }],
    related: [{ href: "/fensterreinigung/solar", label: "Solar", hint: "ab 99 €" }],
  },
  "rahmen-falz-warum-wichtig": {
    title: "Rahmen & Falz reinigen | Warum wichtig — Ilyashan",
    description: "Rahmen und Falz reinigen: Schimmel vermeiden, längere Haltbarkeit. Komplettpaket ab 79 €.",
    headline: "Rahmen & Falz — oft vergessen, aber wichtig",
    subline: "Saubere Scheiben reichen nicht.",
    sections: [
      {
        title: "Schmutz im Falz",
        paragraphs: [
          "Im Falz sammeln sich Staub, Pollen und Feuchtigkeit — ideal für Schimmel. Rahmen & Falz ab 79 € beidseitig.",
        ],
      },
    ],
    faq: [{ q: "Nur Scheiben reicht?", a: "Optisch ja — hygienisch und langfristig nein." }],
    related: [{ href: "/fensterreinigung/rahmen", label: "Rahmen & Falz", hint: "ab 79 €" }],
  },
  "fensterreinigung-haeufigkeit": {
    title: "Wie oft Fenster putzen? | Häufigkeit — Ilyashan",
    description: "Fensterreinigung Häufigkeit: Privat 2×/Jahr, Gewerbe monatlich. Wartungsvertrag ab 59 €/Monat.",
    headline: "Wie oft sollten Fenster professionell gereinigt werden?",
    subline: "Privat, Gewerbe und Solar — unterschiedliche Rhythmen.",
    sections: [
      {
        title: "Empfehlungen",
        paragraphs: ["Privat: 2× jährlich (Frühjahr/Herbst). Gewerbe: monatlich oder nach Bedarf. Solar: 1–2× jährlich."],
        bullets: ["Privat: 2× pro Jahr", "Gewerbe: monatlich", "Wartungsvertrag: ab 59 €/Monat"],
      },
    ],
    faq: [{ q: "Wartungsvertrag sinnvoll?", a: "Ja bei Büros, Praxen und MFH — planbare Kosten." }],
    related: [{ href: "/fensterreinigung/wartung", label: "Wartung", hint: "Vertrag" }],
  },
  "fensterreinigung-umzug-einzug": {
    title: "Fensterreinigung Umzug & Einzug | Ratgeber — Ilyashan",
    description: "Fensterreinigung bei Umzug: Einzug, Auszug, Übergabe. Streifenfrei für die Wohnungsübergabe.",
    headline: "Umzug & Einzug — Fenster glänzen lassen",
    subline: "Übergabe, Einzug, frischer Start.",
    sections: [
      {
        title: "Wann buchen?",
        paragraphs: [
          "Vor Übergabe oder direkt nach Einzug — klare Fenster machen den Unterschied bei der Wohnungsabnahme.",
          "Live-Preisschätzung im Wizard — Festpreis in 24 Stunden.",
        ],
      },
    ],
    faq: [{ q: "Kurzfristig möglich?", a: "Ja — nach Verfügbarkeit. Wizard-Anfrage oder anrufen." }],
    related: [{ href: "/fensterreinigung/privat", label: "Privat", hint: "ab 49 €" }],
  },
  "erste-beauftragung-fensterprofi": {
    title: "Erste Beauftragung Fensterprofi | Ratgeber — Ilyashan",
    description: "Erstes Mal Fensterprofi beauftragen? Ablauf, Vorbereitung, Was Sie wissen sollten — Ilyashan.",
    headline: "Erste Beauftragung — so läuft's ab",
    subline: "Vom Wizard bis zu streifenfreien Fenstern.",
    sections: [
      {
        title: "In vier Schritten",
        paragraphs: [
          "1. Preis im Wizard berechnen. 2. Anfrage absenden — Festpreis in 24h. 3. Termin vereinbaren. 4. Streifenfreie Reinigung — versichert und pünktlich.",
        ],
      },
    ],
    faq: [{ q: "Muss ich anwesend sein?", a: "Nicht zwingend — Schlüsselübergabe nach Absprache möglich." }],
    related: [{ href: "/de/angebot", label: "Wizard", hint: "Start" }],
  },
  "gutschein-fensterreinigung-tipps": {
    title: "Gutschein Fensterreinigung Tipps | Geschenk — Ilyashan",
    description: "Fensterreinigung Gutschein verschenken: Anlässe, Beträge, Bestellung. TreuePay — sofort online.",
    headline: "Fensterreinigung Gutschein — Tipps zum Verschenken",
    subline: "Zeit und Klarheit statt Standardgeschenk.",
    sections: [
      {
        title: "So schenken Sie richtig",
        paragraphs: [
          "Ab 49 € Privat, sofort per E-Mail, Print@Home. Beliebte Anlässe: Muttertag, Einzug, Geburtstag, Danke.",
        ],
      },
    ],
    faq: [{ q: "Wo bestellen?", a: "Online über treuepay.de/ilyashan/gutschein — sofort per E-Mail." }],
    related: [{ href: "/gutschein", label: "Gutschein Hub", hint: "Alle Anlässe" }],
  },
  "glasfassade-reinigung-sicherheit": {
    title: "Glasfassade reinigen | Sicherheit — Ilyashan",
    description: "Glasfassade Reinigung: Sicherheit, Höhe, Aufmaß. Professionelle Fassadenreinigung Baesweiler & Aachen.",
    headline: "Glasfassade — Sicherheit geht vor",
    subline: "Höhe, Zugang, Versicherung — Profis erforderlich.",
    sections: [
      {
        title: "Nicht ohne Profi",
        paragraphs: [
          "Glasfassaden und Hochhausfenster erfordern Spezialausrüstung und Versicherung. Ilyashan kalkuliert nach Aufmaß — sicher und streifenfrei.",
        ],
      },
    ],
    faq: [{ q: "Gewerbe-Angebot?", a: "Ja — Anfrage mit Fläche und Zugänglichkeit, Festpreis in 24h." }],
    related: [{ href: "/fensterreinigung/fassade", label: "Glasfassaden", hint: "Gewerbe" }],
  },
};

export function buildGuidePage(slug: string): GuidePageContent | null {
  if (!(slug in ARTICLE_DEFS)) return null;
  const def = ARTICLE_DEFS[slug as GuideSlug];
  return {
    slug,
    path: `/ratgeber/${slug}`,
    seo: { title: def.title, description: def.description },
    hero: { eyebrow: "Ratgeber · Ilyashan", headline: def.headline, subline: def.subline },
    sections: def.sections,
    keyTakeaways: def.takeaways ? { headline: "Das Wichtigste", items: def.takeaways } : undefined,
    relatedLinks: def.related,
    faq: def.faq,
    closing: {
      headline: "Jetzt Preis berechnen",
      text: `Live-Preisschätzung im Wizard — Festpreis in ${siteConfig.business.responseTime}. Kein Anfahrtszuschlag.`,
      cta: "Preis jetzt berechnen",
    },
  };
}

export function buildGuideHub(): GuideHubContent {
  return {
    slug: "hub",
    path: "/ratgeber",
    seo: {
      title: "Ratgeber Fensterreinigung | Tipps & Preise — Ilyashan",
      description: "Ratgeber: Kosten, Streifenfrei-Tipps, Winter, Gewerbe, Solar, Gutschein. Ilyashan Fensterreinigung Baesweiler & Aachen.",
    },
    hero: {
      eyebrow: "Ratgeber · Fensterreinigung",
      headline: "Wissen, das durchblicken lässt",
      subline: "Preise, Tipps und ehrliche Antworten — von Ihrem Fensterprofi in Baesweiler.",
    },
    articles: {
      eyebrow: "Artikel",
      headline: "Ratgeber-Themen",
      intro: "Kosten, Technik, Anlässe — praxisnah erklärt.",
      items: GUIDE_SLUGS.map((s) => ({
        slug: s,
        label: ARTICLE_DEFS[s].headline,
        hint: ARTICLE_DEFS[s].subline.slice(0, 50),
      })),
    },
    closing: {
      headline: "Fragen? Preis sofort berechnen.",
      text: "Im Wizard sehen Sie live, was Ihre Fensterreinigung kostet.",
      cta: "Preis jetzt berechnen",
    },
  };
}

export function getAllGuidePages(): GuidePageContent[] {
  return GUIDE_SLUGS.map((slug) => buildGuidePage(slug)!);
}
