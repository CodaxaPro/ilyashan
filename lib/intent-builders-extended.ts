import { siteConfig } from "./config";
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

function city(loc: LocationContext) {
  return loc.city;
}

export function buildFensterPutzen(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  const home = isHome(loc.slug);
  return assembleIntentPage("fenster-putzen", loc, {
    seo: {
      title: `Fenster putzen ${c} | Selbst oder Profi? — Ilyashan`,
      description: home
        ? `Fenster putzen in Baesweiler: Leiter, Eimer, Streifen? Wir übernehmen ab 49 € — ansässig, versichert, kein Anfahrtszuschlag.`
        : `Fenster putzen in ${c}: ${travelFrom(loc)}. Streifenfrei vom Profi — Live-Preis im Wizard, Festpreis in 24h.`,
    },
    hero: {
      eyebrow: `Fenster putzen · ${c}`,
      headline: home ? "Fenster putzen — ohne Leiter-Stress." : `Fenster putzen in ${c} — wir nehmen Ihnen das ab.`,
      subline: "Wochenende vertan? Wir putzen streifenfrei — Sie behalten Ihre freie Zeit.",
      trust: `${TRUST} · Ab 49 €`,
    },
    essence: {
      eyebrow: "Selbst machen oder Profi?",
      headline: "Fenster putzen klingt einfach — ist es oft nicht.",
      paragraphs: [
        `Viele in ${c} kennen es: Eimer, Lappen, Streifen — und am Ende sieht man noch Schlieren. Fenster putzen braucht Technik, Zeit und oft eine Leiter.`,
        `Ilyashan übernimmt: Rahmen, Falz, Innen- und Außenseite — streifenfrei, versichert. Im Wizard sehen Sie sofort, was es kostet.`,
        home
          ? "Ansässig in Baesweiler — kein Subunternehmer von außerhalb."
          : `${travelFrom(loc)}. Kein Anfahrtszuschlag — der Festpreis gilt.`,
      ],
    },
    emotions: {
      eyebrow: "Entlastung",
      headline: `Fenster putzen in ${c}`,
      items: [
        { word: "Freizeit", headline: "Samstag zurückgewinnen", text: "Kein Putzen am Wochenende — wir erledigen es." },
        { word: "Sicherheit", headline: "Keine Leiter-Risiken", text: "Wir arbeiten professionell — auch in der Höhe." },
        { word: "Ergebnis", headline: "Wirklich streifenfrei", text: "Nicht halb sauber — klarer Durchblick." },
        { word: "Planbarkeit", headline: "Festpreis vorab", text: "Live-Schätzung online, Angebot in 24h." },
        { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: `Gilt auch für ${c}.` },
        { word: "Vertrauen", headline: `${siteConfig.business.rating}★ regional`, text: siteConfig.business.customers + " Kunden." },
      ],
    },
    localProof: { eyebrow: "Stimmen", headline: "Wer Fensterputzen abgibt, ist froh", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "So geht's",
      headline: "Fenster putzen — ohne dass Sie es tun",
      steps: [
        { num: "01", title: "Wizard öffnen", text: "Fenster zählen, Etage wählen — Preis live." },
        { num: "02", title: "Anfrage senden", text: "Festpreis-Angebot in 24 Stunden." },
        { num: "03", title: "Wir putzen", text: home ? "Vor Ort in Baesweiler." : `Termin in ${c}.` },
        { num: "04", title: "Durchblick", text: "Streifenfrei — Sie lehnen sich zurück." },
      ],
    },
    faq: [
      { q: `Lohnt sich Profi-Fensterputzen in ${c}?`, a: "Wenn Zeit, Leiter und Streifen Sie nerven: ja. Ab 49 € privat, versichert." },
      { q: "Muss ich Material stellen?", a: "Nein — wir bringen alles mit." },
      { q: "Wie oft putzen?", a: "Privat 2–4× jährlich üblich — Wartungsvertrag ab 59 €/Monat möglich." },
      { q: "Anfahrt nach " + c + "?", a: `${travelFrom(loc)}. Kein Anfahrtszuschlag.` },
    ],
    closing: {
      headline: `Fenster putzen in ${c} — Profi beauftragen.`,
      text: "Zeit sparen, Streifen vermeiden — Festpreis in 24h.",
      cta: "Preis jetzt berechnen",
    },
  });
}

export function buildFensterreinigungPreis(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  const home = isHome(loc.slug);
  return assembleIntentPage("fensterreinigung-preis", loc, {
    seo: {
      title: `Fensterreinigung Preis ${c} | Ab 49 € · Festpreis — Ilyashan`,
      description: `Fensterreinigung Preis in ${c}: Privat ab 49 €, Rahmen ab 79 €, Solar ab 99 €. Live im Wizard — verbindliches Angebot in 24h. Kein Anfahrtszuschlag.`,
    },
    hero: {
      eyebrow: `Preis · ${c}`,
      headline: `Fensterreinigung Preis in ${c} — transparent, nicht „auf Anfrage“.`,
      subline: "Live-Preisschätzung im Wizard. Danach: verbindliches Festpreis-Angebot in 24 Stunden.",
      trust: `${TRUST} · Live-Preis`,
    },
    essence: {
      eyebrow: "Preisübersicht",
      headline: "Was kostet Fensterreinigung bei Ihnen?",
      paragraphs: [
        `Der Fensterreinigung-Preis in ${c} hängt von Fensteranzahl, Etage, Verschmutzung und Extras ab — nicht von versteckten Anfahrtskosten.`,
        "Orientierung Ilyashan: Privat ab 49 € · Rahmen & Falz ab 79 € · Solar ab 99 € · Wartung ab 59 €/Monat.",
        "Im Angebots-Wizard auf ilyashan.de sehen Sie sofort eine Schätzung — nach Ihrer Anfrage erhalten Sie den Festpreis schriftlich.",
      ],
    },
    emotions: {
      eyebrow: "Transparenz",
      headline: "Preis, den Sie verstehen",
      items: [
        { word: "Klarheit", headline: "Keine Überraschung", text: "Festpreis vor dem Termin — schriftlich." },
        { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: `Auch für ${c}.` },
        { word: "Kontrolle", headline: "Live im Wizard", text: "Flügel, Etage, Extras — Sie sehen mit." },
        { word: "Schnelligkeit", headline: "Angebot in 24h", text: "Nach Anfrage verbindlich." },
        { word: "Vergleich", headline: "Regional fair", text: `${siteConfig.business.rating}★ — Qualität statt Billig-Streifen.` },
        { word: "Planung", headline: "Budget sicher", text: "Wartungsvertrag für planbare Kosten." },
      ],
    },
    localProof: { eyebrow: "Erfahrung", headline: "Preis-Leistung aus der Region", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Zum Festpreis",
      headline: "In drei Schritten zum Preis",
      steps: [
        { num: "01", title: "Wizard", text: "Fenster & Leistung wählen — Schätzung live." },
        { num: "02", title: "Anfrage", text: "Kontaktdaten — wir kalkulieren verbindlich." },
        { num: "03", title: "Festpreis", text: "Angebot innerhalb 24 Stunden." },
        { num: "04", title: "Termin", text: home ? "Reinigung in Baesweiler." : `Reinigung in ${c}.` },
      ],
    },
    faq: [
      { q: `Fensterreinigung Preis ${c} — wovon abhängig?`, a: "Anzahl Fenster, Etage, Rahmen/Falz, Solar, Verschmutzung." },
      { q: "Gibt es versteckte Kosten?", a: "Nein — kein Anfahrtszuschlag. Festpreis nach Angebot." },
      { q: "Ab welchem Preis?", a: "Privat ab 49 €, Rahmen ab 79 €, Solar ab 99 €." },
      { q: "Kostenlos Angebot?", a: "Ja — Wizard + Festpreis-Angebot in 24h ohne Verpflichtung." },
    ],
    closing: {
      headline: `Fensterreinigung Preis ${c} — jetzt berechnen.`,
      text: "Live-Schätzung — Festpreis in 24 Stunden.",
      cta: "Preis jetzt berechnen",
    },
  });
}

export function buildFensterreinigungKosten(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("fensterreinigung-kosten", loc, {
    seo: {
      title: `Fensterreinigung Kosten ${c} | Was Sie wirklich zahlen — Ilyashan`,
      description: `Fensterreinigung Kosten in ${c} erklärt: Privat, Rahmen, Solar, Gewerbe. Kein Anfahrtszuschlag. ${travelFrom(loc)}.`,
    },
    hero: {
      eyebrow: `Kosten · ${c}`,
      headline: `Fensterreinigung Kosten in ${c} — ehrlich erklärt.`,
      subline: "Nicht nur „ab 49 €“ — sondern was Privat, Rahmen, Solar und Gewerbe wirklich bedeutet.",
      trust: `${TRUST} · Kosten transparent`,
    },
    essence: {
      eyebrow: "Kostenfaktoren",
      headline: "Wovon hängen die Kosten ab?",
      paragraphs: [
        `Fensterreinigung-Kosten in ${c} steigen mit Fensterfläche, Zugänglichkeit (Etage, Leiter) und Leistungsumfang — nicht mit willkürlichen Anfahrtsgebühren.`,
        "Einzelverglasung günstiger als Rahmen+Falz beidseitig. Solar und Fassade nach Modulen bzw. Aufmaß.",
        "Ilyashan: Live-Schätzung im Wizard, Festpreis-Angebot in 24h — Sie wissen vorher, was auf der Rechnung steht.",
      ],
    },
    emotions: {
      eyebrow: "Ehrlichkeit",
      headline: "Kosten ohne Kleingedrucktes",
      items: [
        { word: "Transparenz", headline: "Alle Posten sichtbar", text: "Wizard zeigt die Logik — nicht nur Endsumme." },
        { word: "Sparen", headline: "Kein Anfahrtszuschlag", text: `Ersparnis gegenüber Anbietern mit Fahrtkosten in ${c}.` },
        { word: "Vergleich", headline: "Selbst vs. Profi", text: "Zeit, Leiter, Mittel — oft teurer als gedacht." },
        { word: "Planung", headline: "Wartung planbar", text: "Monatlich ab 59 € statt Einmal-Chaos." },
        { word: "Qualität", headline: "Kein Nachputzen", text: "Streifenfrei beim ersten Mal." },
        { word: "Sicherheit", headline: "Versichert", text: "Schäden abgedeckt — kein Risiko für Sie." },
      ],
    },
    localProof: { eyebrow: "Kunden", headline: "Kosten, die überzeugen", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Kosten klären",
      headline: "So erfahren Sie Ihre Kosten",
      steps: [
        { num: "01", title: "Bedarf klären", text: "Privat, Rahmen, Solar oder Gewerbe?" },
        { num: "02", title: "Wizard nutzen", text: "Schätzung sofort — kostenlos." },
        { num: "03", title: "Festpreis", text: "Schriftliches Angebot in 24h." },
        { num: "04", title: "Entscheiden", text: "In Ruhe vergleichen — ohne Druck." },
      ],
    },
    faq: [
      { q: `Was kostet Fensterreinigung in ${c} durchschnittlich?`, a: "Privat oft 49–120 € je nach Fensterzahl. Wizard gibt individuelle Schätzung." },
      { q: "Teurer als selbst putzen?", a: "Material, Zeit, Leiter, Streifen — Profi oft günstiger in Gesamtzeit." },
      { q: "Gewerbe-Kosten?", a: "Nach Aufmaß — Wartungsvertrag ab 59 €/Monat möglich." },
      { q: "Zahlung?", a: "Nach Leistung — Details im Festpreis-Angebot." },
    ],
    closing: {
      headline: `Fensterreinigung Kosten ${c} — kostenlos kalkulieren.`,
      text: "Wizard öffnen — Festpreis in 24 Stunden.",
      cta: "Kosten berechnen",
    },
  });
}

export function buildFensterreinigungFirma(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("fensterreinigung-firma", loc, {
    seo: {
      title: `Fensterreinigung Firma ${c} | Regional & versichert — Ilyashan`,
      description: `Fensterreinigung Firma für ${c}: Ansässig in Baesweiler, ${travelFrom(loc)}. Versichert, ${siteConfig.business.rating}★, Festpreis in 24h.`,
    },
    hero: {
      eyebrow: `Firma · ${c}`,
      headline: `Fensterreinigung Firma für ${c} — nicht anonym, nicht weit weg.`,
      subline: "Regional verwurzelt seit 2020 — ein Team, feste Ansprechpartner, Betriebshaftpflicht.",
      trust: `${TRUST} · Seit ${siteConfig.business.founded}`,
    },
    essence: {
      eyebrow: "Warum eine Firma?",
      headline: "Seriös, erreichbar, haftbar.",
      paragraphs: [
        `Eine Fensterreinigung-Firma für ${c} sollte erreichbar sein, wenn etwas klemmt — und haften, wenn etwas passiert.`,
        `Ilyashan: Sitz in Baesweiler (Kückstr. 29), ${siteConfig.business.customers} Kunden, ${siteConfig.business.rating}★. Keine Subunternehmer-Kette.`,
        `${travelFrom(loc)}. Festpreis-Kultur: Wizard + Angebot in 24h — Privat und Gewerbe.`,
      ],
    },
    emotions: {
      eyebrow: "Vertrauen",
      headline: "Firma, der Sie vertrauen können",
      items: [
        { word: "Regional", headline: "Aus Baesweiler", text: "Kurze Wege — schnelle Termine." },
        { word: "Haftung", headline: "Versichert", text: "Betriebshaftpflicht — nicht Schwarzarbeit." },
        { word: "Erreichbar", headline: "Telefon & E-Mail", text: siteConfig.contact.phoneDisplay },
        { word: "Erfahrung", headline: siteConfig.business.customers + " Kunden", text: "Referenzen aus der Region." },
        { word: "Qualität", headline: "Streifenfrei-Standard", text: "Gleiche Qualität jedes Mal." },
        { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: `Auch nach ${c}.` },
      ],
    },
    localProof: { eyebrow: "Referenzen", headline: "Firmenkunden & Privat", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Zusammenarbeit",
      headline: "So arbeiten wir mit Ihnen",
      steps: [
        { num: "01", title: "Anfrage", text: "Wizard oder direkter Kontakt." },
        { num: "02", title: "Angebot", text: "Festpreis schriftlich in 24h." },
        { num: "03", title: "Termin", text: "Pünktlich — ein festes Team." },
        { num: "04", title: "Nachbetreuung", text: "Wiederbuchung & Wartung möglich." },
      ],
    },
    faq: [
      { q: `Welche Fensterreinigung Firma in ${c}?`, a: "Ilyashan — ansässig Baesweiler, versichert, regional." },
      { q: "Gewerbe möglich?", a: "Ja — Büro, Praxis, Laden, Hausverwaltung." },
      { q: "Rechnung mit MwSt.?", a: "Ja — professionelle Abrechnung." },
      { q: "Wie schnell Termin?", a: "Nach Angebot — oft innerhalb weniger Tage." },
    ],
    closing: {
      headline: `Fensterreinigung Firma ${c} — Angebot anfordern.`,
      text: "Regional, versichert, transparent.",
      cta: "Preis jetzt berechnen",
    },
  });
}

export function buildSolaranlagenReinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("solaranlagen-reinigung", loc, {
    seo: {
      title: `Solaranlagen-Reinigung ${c} | PV ab 99 € — Ilyashan`,
      description: `Solaranlagen-Reinigung in ${c}: Mehr Ertrag durch saubere Module. Ab 99 €, materialschonend, versichert. ${travelFrom(loc)}.`,
    },
    hero: {
      eyebrow: `Solar · ${c}`,
      headline: `Solaranlagen-Reinigung ${c} — Ertrag statt Schmutzfilm.`,
      subline: "Verschmutzte PV-Module liefern weniger Strom. Wir reinigen fachgerecht — ohne Mikrorisse.",
      trust: `${TRUST} · Solar ab 99 €`,
    },
    essence: {
      eyebrow: "Photovoltaik",
      headline: "Warum Solar reinigen?",
      paragraphs: [
        `Pollen, Staub und Vogelkot auf Modulen in ${c} können den Ertrag spürbar drücken — besonders nach Pollensaison.`,
        "Ilyashan reinigt Solaranlagen materialschonend: keine Hochdruckreiniger auf den Zellen, ab 99 € (ca. 15 Module).",
        "Kombinierbar mit Fenster- und Rahmenreinigung — ein Termin, ein Ansprechpartner.",
      ],
    },
    emotions: {
      eyebrow: "Ertrag",
      headline: "Saubere Module, mehr kWh",
      items: [
        { word: "Ertrag", headline: "Leistung sichern", text: "Schmutz kostet Strom — Reinigung lohnt sich." },
        { word: "Schonung", headline: "Materialschonend", text: "Keine beschädigten Zellen." },
        { word: "Sicherheit", headline: "Dacharbeit Profis", text: "Versichert — nicht selbst aufs Dach." },
        { word: "Kombi", headline: "Fenster + Solar", text: "Ein Termin für Haus und Dach." },
        { word: "Planung", headline: "Saisonal", text: "Frühjahr & Herbst ideal." },
        { word: "Preis", headline: "Ab 99 €", text: "Festpreis nach Wizard/Angebot." },
      ],
    },
    localProof: { eyebrow: "PV-Kunden", headline: "Solar in der Region", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Ablauf Solar",
      headline: "Solaranlagen-Reinigung in 4 Schritten",
      steps: [
        { num: "01", title: "Module zählen", text: "Im Wizard oder Anfrage — Fläche schätzen." },
        { num: "02", title: "Festpreis", text: "Angebot in 24h." },
        { num: "03", title: "Reinigung", text: "Materials schonend auf dem Dach." },
        { num: "04", title: "Mehr Ertrag", text: "Saubere Anlage — besserer Output." },
      ],
    },
    faq: [
      { q: `Solaranlagen-Reinigung ${c} — wie oft?`, a: "1–2× jährlich je nach Lage — oft Frühjahr nach Pollen." },
      { q: "Selbst reinigen?", a: "Rutsch- und Schadensrisiko — Profi empfohlen." },
      { q: "Preis?", a: "Ab 99 € — abhängig von Modulanzahl." },
      { q: "Auch ältere Anlagen?", a: "Ja — schonendes Verfahren." },
    ],
    closing: {
      headline: `Solaranlagen-Reinigung ${c} — Ertrag sichern.`,
      text: "PV ab 99 € — Festpreis in 24h.",
      cta: "Solar-Preis berechnen",
    },
  });
}

export function buildGlasfassadenReinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("glasfassaden-reinigung", loc, {
    seo: {
      title: `Glasfassaden-Reinigung ${c} | Gewerbe & Büro — Ilyashan`,
      description: `Glasfassaden-Reinigung in ${c}: Büro, Praxis, Showroom — streifenfrei, versichert. Flexible Termine. Festpreis auf Anfrage.`,
    },
    hero: {
      eyebrow: `Glasfassade · ${c}`,
      headline: `Glasfassaden-Reinigung ${c} — Ihr Gebäude im besten Licht.`,
      subline: "Große Flächen, Höhe, Image — wir reinigen Glasfassaden professionell und planbar.",
      trust: `${TRUST} · Gewerbe`,
    },
    essence: {
      eyebrow: "Gewerbe-Glas",
      headline: "Fassade = Visitenkarte.",
      paragraphs: [
        `Eine Glasfassade in ${c} transportiert Qualität — Verschmutzung transportiert das Gegenteil.`,
        "Ilyashan reinigt Bürofassaden, Praxen und Showrooms — auch außerhalb der Öffnungszeiten, mit Betriebshaftpflicht.",
        "Aufmaß vor Ort für große Objekte — Festpreis oder Wartungsvertrag.",
      ],
    },
    emotions: {
      eyebrow: "Image",
      headline: "Professioneller Auftritt",
      items: [
        { word: "Image", headline: "Erster Eindruck", text: "Saubere Fassade = seriöses Unternehmen." },
        { word: "Diskretion", headline: "Nach Feierabend", text: "Termine wenn es Ihren Betrieb stört." },
        { word: "Sicherheit", headline: "Höhenarbeit", text: "Geschultes Team, versichert." },
        { word: "Planung", headline: "Wartungsplan", text: "Regelmäßig statt Notfall." },
        { word: "Qualität", headline: "Streifenfrei", text: "Auch bei großen Flächen." },
        { word: "Partnerschaft", headline: "Fester Ansprechpartner", text: "Nicht jedes Mal ein neues Team." },
      ],
    },
    localProof: { eyebrow: "Gewerbe", headline: "Objekte in der Region", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Gewerbe-Ablauf",
      headline: "Glasfassade reinigen lassen",
      steps: [
        { num: "01", title: "Objekt beschreiben", text: "Fläche, Etagen, Zugang." },
        { num: "02", title: "Aufmaß / Angebot", text: "Festpreis oder Vertrag." },
        { num: "03", title: "Terminfenster", text: "Abends oder Wochenende möglich." },
        { num: "04", title: "Saubere Fassade", text: "Image gewahrt — streifenfrei." },
      ],
    },
    faq: [
      { q: `Glasfassaden-Reinigung ${c} — Gewerbe?`, a: "Ja — Büro, Klinik, Showroom, MFH." },
      { q: "Wie oft?", a: "2–4× jährlich je nach Lage (Staub, Verkehr)." },
      { q: "Außerhalb Öffnungszeiten?", a: "Ja — auf Anfrage." },
      { q: "Versicherung?", a: "Betriebshaftpflicht inklusive." },
    ],
    closing: {
      headline: `Glasfassaden-Reinigung ${c} — Angebot anfordern.`,
      text: "Gewerbe-Festpreis — professionell & versichert.",
      cta: "Gewerbe-Anfrage",
    },
  });
}

export function buildSchaufensterReinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("schaufenster-reinigung", loc, {
    seo: {
      title: `Schaufenster-Reinigung ${c} | Laden & Praxis — Ilyashan`,
      description: `Schaufenster-Reinigung in ${c}: Streifenfrei vor Öffnung — Einzelhandel, Café, Praxis. Flexibel, versichert.`,
    },
    hero: {
      eyebrow: `Schaufenster · ${c}`,
      headline: `Schaufenster-Reinigung ${c} — Kunden sehen nur das Gute.`,
      subline: "Fingerabdrücke, Staub, Regenspritzer — wir putzen, bevor Sie aufschließen.",
      trust: `${TRUST} · Vor Öffnung`,
    },
    essence: {
      eyebrow: "Einzelhandel",
      headline: "Schaufenster verkauft mit.",
      paragraphs: [
        `In ${c} entscheiden Kunden in Sekunden — schmutzige Schaufenster kosten Umsatz.`,
        "Ilyashan reinigt Ladenfronten, Praxisscheiben und Gastronomie-Fenster — früh morgens oder nach Ladenschluss.",
        "Regelmäßige Touren möglich — feste Fenster, fester Preis pro Besuch.",
      ],
    },
    emotions: {
      eyebrow: "Umsatz",
      headline: "Klarer Blick aufs Sortiment",
      items: [
        { word: "Umsatz", headline: "Einladend statt schmutzig", text: "Sauberes Schaufenster zieht rein." },
        { word: "Timing", headline: "Vor Öffnung", text: "Kunden sehen nur Ergebnis." },
        { word: "Regelmäßig", headline: "Jede Woche gleich", text: "Wartung statt Scham." },
        { word: "Diskret", headline: "Kein Staub im Laden", text: "Arbeit draußen oder in ruhigen Zeiten." },
        { word: "Vertrauen", headline: "Versichert", text: "Auch an öffentlichen Flächen." },
        { word: "Preis", headline: "Planbar", text: "Festpreis pro Tour oder Monat." },
      ],
    },
    localProof: { eyebrow: "Ladenbesitzer", headline: "Retail in der Region", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Laden-Service",
      headline: "Schaufenster — so läuft's",
      steps: [
        { num: "01", title: "Scheiben & Rhythmus", text: "Wie viele, wie oft?" },
        { num: "02", title: "Angebot", text: "Festpreis pro Besuch oder Monat." },
        { num: "03", title: "Reinigung", text: "Vor Öffnung oder abends." },
        { num: "04", title: "Wiederholung", text: "Fester Turnus — kein Vergessen." },
      ],
    },
    faq: [
      { q: `Schaufenster-Reinigung ${c} — wie oft?`, a: "Wöchentlich bis monatlich — je nach Lage." },
      { q: "Auch innen?", a: "Ja — innen und außen auf Wunsch." },
      { q: "Café / Restaurant?", a: "Ja — Fettfilm und Fingerabdrücke." },
      { q: "Vertrag?", a: "Monatliche Pauschale möglich." },
    ],
    closing: {
      headline: `Schaufenster-Reinigung ${c} — Termin anfragen.`,
      text: "Streifenfrei vor dem ersten Kunden.",
      cta: "Gewerbe-Anfrage",
    },
  });
}

export function buildWintergartenReinigung(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("wintergarten-reinigung", loc, {
    seo: {
      title: `Wintergarten-Reinigung ${c} | Veranda & Glasdach — Ilyashan`,
      description: `Wintergarten-Reinigung in ${c}: Viele Flächen, schwer erreichbar — wir reinigen Wintergarten & Veranda streifenfrei.`,
    },
    hero: {
      eyebrow: `Wintergarten · ${c}`,
      headline: `Wintergarten-Reinigung ${c} — Licht zurück in Ihren Wohnraum.`,
      subline: "Viele Glasflächen, Dachfenster, Profile — wir haben Erfahrung mit Wintergärten.",
      trust: `${TRUST} · Spezialflächen`,
    },
    essence: {
      eyebrow: "Viel Glas",
      headline: "Wintergarten = Pflege-Challenge.",
      paragraphs: [
        `Wintergärten in ${c} sammeln Pollen, Algen und Staub an Dach und Seiten — normales Putzen reicht selten.`,
        "Ilyashan reinigt Wintergarten-Verglasung, Profile und schwer erreichbare Scheiben — materialschonend.",
        "Kombinierbar mit Rahmen- & Falzreinigung für dauerhaft klare Sicht.",
      ],
    },
    emotions: {
      eyebrow: "Wohngefühl",
      headline: "Wintergarten als Wohnzimmer",
      items: [
        { word: "Licht", headline: "Heller Raum", text: "Schmutziges Glas dämpft die Stimmung." },
        { word: "Aufwand", headline: "Zu viele Flächen", text: "Wir nehmen die Stunden." },
        { word: "Technik", headline: "Profile & Dach", text: "Nicht nur die senkrechten Scheiben." },
        { word: "Schonung", headline: "Rahmen & Dichtung", text: "Keine beschädigten Profile." },
        { word: "Saison", headline: "Frühjahr-Reset", text: "Nach Winter besonders sinnvoll." },
        { word: "Komfort", headline: "Ein Termin", text: "Ganzes System in einem Besuch." },
      ],
    },
    localProof: { eyebrow: "Hausbesitzer", headline: "Wintergärten in der Region", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Wintergarten",
      headline: "Reinigung komplexer Glasräume",
      steps: [
        { num: "01", title: "Fläche erfassen", text: "Dach, Seiten, Türen — im Wizard." },
        { num: "02", title: "Festpreis", text: "Angebot in 24h." },
        { num: "03", title: "Reinigung", text: "Systematisch alle Glasflächen." },
        { num: "04", title: "Wohnlicht", text: "Wintergarten wieder Wohnraum." },
      ],
    },
    faq: [
      { q: `Wintergarten-Reinigung ${c} — Preis?`, a: "Abhängig von Fläche — Wizard oder Aufmaß." },
      { q: "Nur außen?", a: "Innen, außen oder beides." },
      { q: "Algen am Glasdach?", a: "Ja — materialschonende Entfernung." },
      { q: "Wie oft?", a: "1–2× jährlich empfohlen." },
    ],
    closing: {
      headline: `Wintergarten-Reinigung ${c} — Anfrage stellen.`,
      text: "Licht & Klarheit — streifenfrei.",
      cta: "Preis jetzt berechnen",
    },
  });
}

export function buildHausmeisterFenster(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("hausmeister-fenster", loc, {
    seo: {
      title: `Hausmeister Fenster ${c} | Hausverwaltung Partner — Ilyashan`,
      description: `Fenster für Hausverwaltung in ${c}: Treppenhaus, MFH, WEG — planbare Termine, Festpreis, versichert.`,
    },
    hero: {
      eyebrow: `Hausverwaltung · ${c}`,
      headline: `Fenster für Hausverwaltung in ${c} — zuverlässiger Partner.`,
      subline: "Treppenhaus, Gemeinschaftsflächen, MFH-Fenster — ein Ansprechpartner statt vieler Subunternehmer.",
      trust: `${TRUST} · B2B`,
    },
    essence: {
      eyebrow: "WEG & MFH",
      headline: "Hausmeister-Service für Fenster.",
      paragraphs: [
        `Hausverwaltungen in ${c} brauchen planbare Fensterreinigung — nicht Ausreden und Nachtermine.`,
        "Ilyashan: Feste Turnusvereinbarungen, dokumentierte Leistung, versichertes Team — Rechnung für die WEG.",
        "Treppenhaus, Außenfenster, Gemeinschaftsräume — nach Objektgröße kalkuliert.",
      ],
    },
    emotions: {
      eyebrow: "Verwaltung",
      headline: "Weniger Koordinationsaufwand",
      items: [
        { word: "Planung", headline: "Fester Turnus", text: "Quartalsweise oder halbjährlich." },
        { word: "Dokumentation", headline: "Nachweis für Eigentümer", text: "Leistung nachvollziehbar." },
        { word: "Erreichbar", headline: "Ein Ansprechpartner", text: "Kein Sub-Chaos." },
        { word: "Haftung", headline: "Versichert", text: "Wichtig bei MFH und Gemeinschaft." },
        { word: "Mieter", headline: "Zufriedene Bewohner", text: "Saubere Treppenhäuser." },
        { word: "Budget", headline: "Festpreis pro Objekt", text: "Planbar für die WEG." },
      ],
    },
    localProof: { eyebrow: "Verwaltung", headline: "Objektbetreuung", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "B2B",
      headline: "Partnerschaft Hausverwaltung",
      steps: [
        { num: "01", title: "Objektliste", text: "Adressen, Fenster, Turnus." },
        { num: "02", title: "Rahmenvertrag", text: "Festpreis pro Besuch/Jahr." },
        { num: "03", title: "Durchführung", text: "Termine mit Hausmeister abstimmen." },
        { num: "04", title: "Abrechnung", text: "Sammelrechnung möglich." },
      ],
    },
    faq: [
      { q: `Hausverwaltung Fenster ${c}?`, a: "Ja — MFH, WEG, Gewerbeobjekte." },
      { q: "Treppenhaus nur?", a: "Auch Außenfenster & Gemeinschaftsräume." },
      { q: "Notfall?", a: "Nach Absprache kurzfristige Termine." },
      { q: "Wartungsvertrag?", a: "Ja — ab 59 €/Monat für kleinere Objekte." },
    ],
    closing: {
      headline: `Hausmeister Fenster ${c} — Partner werden.`,
      text: "Planbar, versichert, regional.",
      cta: "Gewerbe-Anfrage",
    },
  });
}

export function buildWartungsvertragFenster(_type: IntentType, loc: LocationContext): BuiltIntentPage {
  const c = city(loc);
  return assembleIntentPage("wartungsvertrag-fenster", loc, {
    seo: {
      title: `Wartungsvertrag Fenster ${c} | Ab 59 €/Monat — Ilyashan`,
      description: `Wartungsvertrag Fensterreinigung in ${c}: Regelmäßig klare Fenster ab 59 €/Monat. Planbar, versichert, kein Anfahrtszuschlag.`,
    },
    hero: {
      eyebrow: `Wartung · ${c}`,
      headline: `Wartungsvertrag Fenster ${c} — nie wieder vergessen.`,
      subline: "Monatlich oder quartalsweise — feste Fenster, fester Preis, festes Team.",
      trust: `${TRUST} · Ab 59 €/Monat`,
    },
    essence: {
      eyebrow: "Abo statt Stress",
      headline: "Immer klare Fenster — automatisch.",
      paragraphs: [
        `Ein Wartungsvertrag für Fenster in ${c} bedeutet: kein jährliches Aufschieben, keine vergessenen Termine.`,
        "Ilyashan Wartung ab 59 €/Monat — Privat und kleine Gewerbeobjekte. Turnus nach Bedarf.",
        "Kündbar, transparent, mit festem Ansprechpartner aus Baesweiler.",
      ],
    },
    emotions: {
      eyebrow: "Routine",
      headline: "Fensterpflege auf Autopilot",
      items: [
        { word: "Planbar", headline: "Fester Monatspreis", text: "Kein Preisschock einmal im Jahr." },
        { word: "Komfort", headline: "Wir erinnern uns", text: "Sie müssen nicht nachfragen." },
        { word: "Wert", headline: "Immobilie pflegen", text: "Regelmäßige Reinigung erhält den Zustand." },
        { word: "Zeit", headline: "Kein Putz-Marathon", text: "Kleine Touren statt Großaktion." },
        { word: "Vertrauen", headline: "Gleiches Team", text: "Kennt Ihre Fenster." },
        { word: "Flexibel", headline: "Turnus wählbar", text: "Monatlich bis quartalsweise." },
      ],
    },
    localProof: { eyebrow: "Stammkunden", headline: "Wartung in der Region", quotes: SHARED_QUOTES },
    journey: {
      eyebrow: "Vertrag",
      headline: "Wartungsvertrag starten",
      steps: [
        { num: "01", title: "Bedarf klären", text: "Fensterzahl, Turnus, Objekt." },
        { num: "02", title: "Vertrag", text: "Monatspreis ab 59 € — schriftlich." },
        { num: "03", title: "Erster Termin", text: "Baseline — alles streifenfrei." },
        { num: "04", title: "Routine", text: "Feste Besuche — automatisch." },
      ],
    },
    faq: [
      { q: `Wartungsvertrag Fenster ${c} — ab wann?`, a: "Ab 59 €/Monat — je nach Fensterzahl." },
      { q: "Mindestlaufzeit?", a: "Nach Vereinbarung — fair kündbar." },
      { q: "Gewerbe?", a: "Ja — auch kleine Objekte." },
      { q: "Pause im Winter?", a: "Turnus individuell anpassbar." },
    ],
    closing: {
      headline: `Wartungsvertrag Fenster ${c} — jetzt anfragen.`,
      text: "Ab 59 €/Monat — planbar & streifenfrei.",
      cta: "Wartung anfragen",
    },
  });
}

export const EXTENDED_INTENT_BUILDERS = {
  "fenster-putzen": buildFensterPutzen,
  "fensterreinigung-preis": buildFensterreinigungPreis,
  "fensterreinigung-kosten": buildFensterreinigungKosten,
  "fensterreinigung-firma": buildFensterreinigungFirma,
  "solaranlagen-reinigung": buildSolaranlagenReinigung,
  "glasfassaden-reinigung": buildGlasfassadenReinigung,
  "schaufenster-reinigung": buildSchaufensterReinigung,
  "wintergarten-reinigung": buildWintergartenReinigung,
  "hausmeister-fenster": buildHausmeisterFenster,
  "wartungsvertrag-fenster": buildWartungsvertragFenster,
} as const;
