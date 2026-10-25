import { routes } from "@/lib/routes";

export type ServicePageContent = {
  path: string;
  name: string;
  /** Value for contact form / CRM */
  serviceKey: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  title: string;
  lede: string;
  includes: string[];
  excludes: string[];
  steps: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  related: { href: string; label: string }[];
  primaryHref: string;
  primaryLabel: string;
  priceNote: string;
  image?: { src: string; alt: string; caption: string };
};

const visitSteps = [
  {
    title: "Anfrage",
    text: "Leistung, Ort und Größe. Telefon, Formular oder WhatsApp.",
  },
  {
    title: "Besichtigung",
    text: "Wir sehen das Objekt, bevor ein Preis feststeht.",
  },
  {
    title: "Festpreis",
    text: "Den Preis schicken wir nach der Besichtigung. Danach der Termin.",
  },
];

export const servicePages = {
  bau: {
    path: "/bauendreinigung",
    name: "Bauendreinigung",
    serviceKey: "bauendreinigung",
    metaTitle: "Bauendreinigung Aachen und Baesweiler",
    description:
      "Bauendreinigung nach Abschluss der Arbeiten in Aachen und Baesweiler. Staub, Farbe, Folie und Sanitär zur Übergabe. Festpreis nach Besichtigung.",
    eyebrow: "Aachen und Baesweiler",
    title: "Neubau übergabefertig. Ohne Baustaub.",
    lede: "Die Handwerker sind raus. Staub, Farbe, Folie und Klebereste bleiben. Wir machen den Neubau übergabefertig — Festpreis nach Besichtigung.",
    includes: [
      "Baustaub auf Böden, Wänden und Flächen",
      "Farb-, Lack- und Mörtelreste",
      "Schutzfolien, Etiketten und Klebereste",
      "Fenster, Türen, Leisten, Schalter und Steckdosen",
      "Sanitäranlagen zur Übergabe",
    ],
    excludes: [
      "Grobreinigung, solange die Baustelle noch läuft",
      "Containerdienst und Abbruch",
      "Asbest, KMF und anderer Sondermüll",
    ],
    steps: visitSteps,
    faq: [
      {
        q: "Wann ist eine Bauendreinigung sinnvoll?",
        a: "Wenn die Arbeiten abgeschlossen sind und die Übergabe ansteht. Solange die Baustelle läuft, ist das eine andere Leistung.",
      },
      {
        q: "Räumen Sie Bauschutt?",
        a: "Nein. Container, Abbruch und Sondermüll wie Asbest oder KMF übernehmen wir nicht.",
      },
      {
        q: "Was kostet die Bauendreinigung?",
        a: "Nach der Besichtigung, als Festpreis. In Aachen, Baesweiler und den genannten Orten ohne Anfahrtszuschlag.",
      },
      {
        q: "Ist das dasselbe wie nach einer Renovierung?",
        a: "Nein. Bauendreinigung ist die Übergabe nach dem Neubau. Renovierungsreinigung ist der feine Staub nach Arbeiten in bestehenden Räumen.",
      },
    ],
    related: [
      { href: routes.renovierungsreinigung, label: "Renovierungsreinigung" },
      { href: routes.fensterreinigung, label: "Fensterreinigung" },
    ],
    primaryHref: "#anfrage",
    primaryLabel: "Anfrage senden",
    priceNote: "Festpreis nach Besichtigung. Sitz: Kückstr. 29, 52499 Baesweiler.",
    image: {
      src: "/images/bauendreinigung.jpg",
      alt: "Leerer Neubau mit weißen Wänden, neuer Tür und hellem Boden nach der Bauendreinigung.",
      caption: "Bauendreinigung. Neubau, übergabefertig.",
    },
  },
  renovierung: {
    path: "/renovierungsreinigung",
    name: "Renovierungsreinigung",
    serviceKey: "renovierungsreinigung",
    metaTitle: "Renovierungsreinigung Aachen und Baesweiler",
    description:
      "Renovierungsreinigung in Aachen und Baesweiler. Feinstaub, Farbspritzer und Übergabe nach Farbe, Putz oder neuem Boden. Festpreis nach Besichtigung.",
    eyebrow: "Aachen und Baesweiler",
    title: "Nach Farbe und Putz: bezugsfertig.",
    lede: "Es wurde gestrichen, gespachtelt oder der Boden erneuert. Der feine Staub liegt in der bestehenden Wohnung oder im Büro. Das ist keine Neubau-Übergabe.",
    includes: [
      "Feinstaub nach Schleif- und Malerarbeiten",
      "Farbspritzer an Rahmen, Böden und Armaturen",
      "Fenster und Glasflächen nach der Renovierung",
      "Sanitär, Türen, Leisten und Schalter",
      "Bezugsfertige Übergabe der renovierten Räume",
    ],
    excludes: [
      "Laufende Baustelle und Bauschutt",
      "Maler-, Boden- oder Elektroarbeiten",
      "Umzug in eine neue Wohnung",
    ],
    steps: visitSteps,
    faq: [
      {
        q: "Für welche Objekte ist die Renovierungsreinigung?",
        a: "Für Wohnungen und Büros, in denen gestrichen, gespachtelt oder der Boden erneuert wurde.",
      },
      {
        q: "Übernehmen Sie die Handwerksarbeiten?",
        a: "Nein. Wir reinigen danach. Maler, Boden und Elektro bleiben bei den Gewerken.",
      },
      {
        q: "Was kostet es?",
        a: "Nach der Besichtigung zum Festpreis. Kein Anfahrtszuschlag in der genannten Region.",
      },
      {
        q: "Ziehen Sie anschließend um?",
        a: "Nein. Entrümpelung leert eine Wohnung. Ein Umzug in eine neue Wohnung ist kein Auftrag von uns.",
      },
    ],
    related: [
      { href: routes.bauendreinigung, label: "Bauendreinigung" },
      { href: routes.bueroreinigung, label: "Büroreinigung" },
    ],
    primaryHref: "#anfrage",
    primaryLabel: "Anfrage senden",
    priceNote: "Festpreis nach Besichtigung. Sitz: Kückstr. 29, 52499 Baesweiler.",
    image: {
      src: "/images/renovierungsreinigung.jpg",
      alt: "Weiße Küche mit sauberer Arbeitsfläche und Spüle nach der Renovierungsreinigung.",
      caption: "Renovierungsreinigung. Küche nach den Arbeiten.",
    },
  },
  praxis: {
    path: "/praxisreinigung",
    name: "Praxisreinigung",
    serviceKey: "praxisreinigung",
    metaTitle: "Praxisreinigung Aachen und Baesweiler",
    description:
      "Praxisreinigung für Arzt, Zahnarzt und Physiotherapie in Aachen und Baesweiler. Wartezimmer, Behandlung, Empfang und Sanitär nach Ihrem Hygieneplan.",
    eyebrow: "Aachen und Baesweiler",
    title: "Praxisreinigung nach Ihrem Hygieneplan.",
    lede: "Wartezimmer, Behandlung, Empfang und Sanitär für Arzt, Zahnarzt und Physiotherapie. Die Reinigung folgt Ihrem Hygieneplan — auch außerhalb der Sprechzeit.",
    includes: [
      "Wartezimmer, Empfang und Personalraum",
      "Behandlungsräume und Liegen",
      "Kontaktflächen nach Ihrem Hygieneplan",
      "Sanitär und Teeküche",
      "Turnus außerhalb der Sprechzeit, wenn Sie das wollen",
    ],
    excludes: [
      "Krankenhaus, OP und Reinraum",
      "Aufbereitung medizinischer Instrumente",
      "Entsorgung von infektiösem Sonderabfall",
    ],
    steps: visitSteps,
    faq: [
      {
        q: "Welche Praxen reinigen Sie?",
        a: "Arzt, Zahnarzt und Physiotherapie. Kein Krankenhaus und kein OP.",
      },
      {
        q: "Folgen Sie einem Hygieneplan?",
        a: "Ja. Die Praxis gibt den Plan vor. Wir reinigen danach.",
      },
      {
        q: "Können Sie außerhalb der Sprechzeit kommen?",
        a: "Ja, wenn der Turnus so vereinbart ist.",
      },
      {
        q: "Was kostet die Praxisreinigung?",
        a: "Nach der Besichtigung zum Festpreis. Die Online-Flächenkalkulation der Büroreinigung gilt hier nicht.",
      },
    ],
    related: [
      { href: routes.bueroreinigung, label: "Büroreinigung" },
      { href: routes.fensterreinigung, label: "Fensterreinigung" },
    ],
    primaryHref: "#anfrage",
    primaryLabel: "Anfrage senden",
    priceNote: "Festpreis nach Besichtigung. Sitz: Kückstr. 29, 52499 Baesweiler.",
    image: {
      src: "/images/praxisreinigung.jpg",
      alt: "Leerer Behandlungsraum mit Liege, Waschbecken und Spendern nach der Praxisreinigung.",
      caption: "Praxisreinigung. Behandlungsraum nach der Reinigung.",
    },
  },
  entruempelung: {
    path: "/entruempelung",
    name: "Entrümpelung",
    serviceKey: "entruempelung",
    metaTitle: "Entrümpelung Aachen und Baesweiler",
    description:
      "Entrümpelung und Wohnungsauflösung in Aachen und Baesweiler. Wohnung leeren, besenrein übergeben. Kein Umzug in eine neue Wohnung.",
    eyebrow: "Aachen und Baesweiler",
    title: "Wohnung leer und besenrein übergeben.",
    lede: "Die Wohnung muss leer und besenrein an den Vermieter. Wir räumen Wohnung, Haus oder Keller. Möbel in eine neue Wohnung bringen wir nicht.",
    includes: [
      "Wohnungs- oder Haushaltsauflösung",
      "Keller, Dachboden und einzelne Räume",
      "Demontage, Abtransport und besenreine Übergabe",
      "Termine auch nach Todesfall oder Umzug ins Pflegeheim",
    ],
    excludes: [
      "Umzug in eine neue Wohnung",
      "Möbellagerung",
      "Verkauf oder Wertanrechnung von Hausrat",
    ],
    steps: visitSteps,
    faq: [
      {
        q: "Ziehen Sie in die neue Wohnung um?",
        a: "Nein. Wir leeren und übergeben besenrein. Der Transport in ein neues Zuhause ist ein anderer Auftrag.",
      },
      {
        q: "Lagern Sie Möbel?",
        a: "Nein.",
      },
      {
        q: "Rechnen Sie den Wert des Hausrats an?",
        a: "Nein. Kein Ankauf und keine Wertanrechnung.",
      },
      {
        q: "Was kostet die Entrümpelung?",
        a: "Nach der Besichtigung zum Festpreis. Größe und Zugänglichkeit entscheiden, nicht ein Online-Rechner.",
      },
    ],
    related: [
      { href: routes.renovierungsreinigung, label: "Renovierungsreinigung" },
      { href: routes.bauendreinigung, label: "Bauendreinigung" },
    ],
    primaryHref: "#anfrage",
    primaryLabel: "Anfrage senden",
    priceNote: "Festpreis nach Besichtigung. Sitz: Kückstr. 29, 52499 Baesweiler.",
    image: {
      src: "/images/entruempelung.jpg",
      alt: "Leere Wohnung mit Dielenboden und Fenster nach der Entrümpelung.",
      caption: "Entrümpelung. Wohnung leer, besenrein.",
    },
  },
  buero: {
    path: "/bueroreinigung",
    name: "Büroreinigung",
    serviceKey: "bueroreinigung",
    metaTitle: "Büroreinigung Aachen und Baesweiler",
    description:
      "Büroreinigung in Aachen und Baesweiler. Boden, Schreibtische, Sanitär und Teeküche im Turnus. Fläche online kalkulieren, Festpreis nach Prüfung.",
    eyebrow: "Aachen und Baesweiler",
    title: "Büroreinigung im Turnus. Vor Arbeitsbeginn.",
    lede: "Boden, Schreibtische, Sanitär und Teeküche — wiederkehrend, oft bevor das Team kommt. Kein einmaliger Abschluss nach dem Bau.",
    includes: [
      "Böden und Verkehrsflächen saugen und wischen",
      "Schreibtische und Arbeitsplätze abwischen",
      "Sanitäranlagen und Armaturen reinigen",
      "Teeküche und gemeinsame Flächen",
      "Vereinbarter Turnus, auch vor Öffnung des Büros",
      "Orientierung online nach Fläche — Festpreis nach Prüfung",
    ],
    excludes: [
      "Bauendreinigung und Bauschutt",
      "Krankenhaus und OP",
      "Fensterreinigung in diesem Auftrag",
    ],
    steps: [
      {
        title: "Fläche kalkulieren",
        text: "Im Rechner sehen Sie eine Orientierung nach Fläche, Sanitär und Küche.",
      },
      {
        title: "Prüfung",
        text: "Wir prüfen die Angabe. Die Zahl im Rechner ist noch kein Festpreis.",
      },
      {
        title: "Festpreis",
        text: "Den verbindlichen Preis schicken wir nach der Prüfung. Danach der Turnus.",
      },
    ],
    faq: [
      {
        q: "Ist der Preis im Rechner verbindlich?",
        a: "Nein. Er ist eine Kalkulation. Den Festpreis bestätigen wir nach der Prüfung.",
      },
      {
        q: "Reinigen Sie ein Büro einmalig nach dem Bau?",
        a: "Dafür gibt es die Bauendreinigung. Büroreinigung ist die wiederkehrende Unterhaltsreinigung.",
      },
      {
        q: "Sind Fenster im Büropreis enthalten?",
        a: "Nein. Fenster haben einen eigenen Preis im Fensterrechner.",
      },
      {
        q: "Gibt es einen Anfahrtszuschlag?",
        a: "In Aachen, Baesweiler und den genannten Orten nein.",
      },
    ],
    related: [
      { href: routes.bueroreinigungAngebot, label: "Fläche kalkulieren" },
      { href: routes.praxisreinigung, label: "Praxisreinigung" },
      { href: routes.fensterreinigung, label: "Fensterreinigung" },
    ],
    primaryHref: routes.bueroreinigungAngebot,
    primaryLabel: "Fläche kalkulieren",
    priceNote: "Die Online-Kalkulation ist eine Orientierung. Der Festpreis folgt nach der Prüfung.",
    image: {
      src: "/images/bueroreinigung.jpg",
      alt: "Leeres Büro mit Schreibtischen, Teppich und Glaswand nach der Büroreinigung.",
      caption: "Büroreinigung. Boden, Tische, Glas.",
    },
  },
} satisfies Record<string, ServicePageContent>;

export const homeFaq = [
  {
    q: "Welche Leistungen bietet Ilyashan?",
    a: "Fensterreinigung, Büroreinigung, Bauendreinigung, Renovierungsreinigung, Praxisreinigung und Entrümpelung.",
  },
  {
    q: "Wo gibt es sofort einen Preis?",
    a: "Bei der Fensterreinigung im Rechner, als Schätzung. Den Festpreis gibt es in 24 Stunden. Die Bürofläche lässt sich online kalkulieren. Bau, Renovierung, Praxis und Entrümpelung bekommen den Festpreis nach der Besichtigung.",
  },
  {
    q: "Wo fahren Sie hin?",
    a: "Sitz in Baesweiler, Kückstr. 29. Aachen und die genannten Orte ohne Anfahrtszuschlag.",
  },
  {
    q: "Ziehen Sie auch um?",
    a: "Nein. Entrümpelung heißt: Wohnung leeren und besenrein übergeben. Möbel in eine neue Wohnung bringen wir nicht.",
  },
];
