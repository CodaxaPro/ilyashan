import { siteConfig } from "./config";
import { LOCATION_SLUGS } from "./seo-config";

type EmotionItem = { word: string; headline: string; text: string };
type JourneyStep = { num: string; title: string; text: string };

export type BuiltGiftPage = {
  slug: string;
  path: string;
  seo: { title: string; description: string };
  hero: { eyebrow: string; headline: string; subline: string; trust: string };
  essence: { eyebrow: string; headline: string; paragraphs: string[] };
  emotions: { eyebrow: string; headline: string; items: EmotionItem[] };
  recipients?: { eyebrow: string; headline: string; items: { title: string; text: string }[] };
  journey: { eyebrow: string; headline: string; steps: JourneyStep[] };
  faq: { q: string; a: string }[];
  closing: { headline: string; text: string; cta: string };
};

const DEFAULT_EMOTIONS: EmotionItem[] = [
  { word: "Klarheit", headline: "Durchblick schenken", text: "Streifenfreie Fenster — sichtbarer als Blumen." },
  { word: "Zeit", headline: "Zeit statt Zeug", text: "Entlastung, die ankommt — nicht im Schrank landet." },
  { word: "Vertrauen", headline: "Seriös & versichert", text: `${siteConfig.business.rating}★ · ${siteConfig.business.customers} Kunden` },
  { word: "Fairness", headline: "Kein Anfahrtszuschlag", text: "Einlösbar in Baesweiler und Region Aachen." },
  { word: "Überraschung", headline: "Unerwartet gut", text: "Ein Geschenk, das wirklich hilft." },
  { word: "Erinnerung", headline: "Bleibt", text: "Monate später: klare Fenster, gute Erinnerung." },
];

const DEFAULT_JOURNEY: JourneyStep[] = [
  { num: "01", title: "Bestellen", text: "Online — sofort per E-Mail, Print@Home." },
  { num: "02", title: "Verschenken", text: "Digital oder ausgedruckt überreichen." },
  { num: "03", title: "Einlösen", text: "Termin in Baesweiler und Region Aachen." },
  { num: "04", title: "Freude", text: "Streifenfreie Fenster — garantiert." },
];

const DEFAULT_FAQ = [
  { q: "Sofort verfügbar?", a: "Ja — Gutschein sofort per E-Mail. Print@Home oder digital." },
  { q: "Preise?", a: "Privat ab 49 €, Rahmen & Falz ab 79 €, Solar ab 99 € — oder Wunschbetrag." },
  { q: "Wo einlösbar?", a: "Baesweiler, Aachen und gesamtes Einsatzgebiet — kein Anfahrtszuschlag." },
  { q: "Welcher Betrag?", a: "Ab 49 € — der sichere Einstieg für die meisten Geschenke." },
];

function page(
  slug: string,
  seo: { title: string; description: string },
  hero: BuiltGiftPage["hero"],
  essence: BuiltGiftPage["essence"],
  opts?: Partial<Pick<BuiltGiftPage, "recipients" | "faq" | "closing" | "emotions">>,
): BuiltGiftPage {
  return {
    slug,
    path: `/gutschein/${slug}`,
    seo,
    hero,
    essence,
    emotions: opts?.emotions ?? {
      eyebrow: "Sechs Worte des Geschenks",
      headline: "Klarheit — auf eine besondere Art",
      items: DEFAULT_EMOTIONS,
    },
    recipients: opts?.recipients,
    journey: { eyebrow: "Gutschein schenken", headline: "In Minuten bestellt", steps: DEFAULT_JOURNEY },
    faq: opts?.faq ?? DEFAULT_FAQ,
    closing: {
      headline: opts?.closing?.headline ?? "Klarheit, die ankommt — nicht verstaubt.",
      text: opts?.closing?.text ?? "Fensterreinigung Gutschein — Zeit und Durchblick verschenken.",
      cta: opts?.closing?.cta ?? "Gutschein bestellen",
    },
  };
}

const REGION_RECIPIENTS = {
  eyebrow: "Region",
  headline: "Gutschein verschenken — in Ihrer Stadt",
  items: LOCATION_SLUGS.slice(0, 4).map((s) => ({
    title: s === "baesweiler" ? "Baesweiler" : s.charAt(0).toUpperCase() + s.slice(1),
    text: s === "baesweiler" ? "Direkt vor Ort — Kückstr. 29" : `/geschenk-${s}`,
  })),
};

const BUILDERS: Record<string, () => BuiltGiftPage> = {
  online: () =>
    page(
      "online",
      {
        title: "Gutschein online kaufen | E-Gutschein sofort — Ilyashan",
        description: "Gutschein online kaufen: Fensterreinigung E-Gutschein sofort per E-Mail. Digital bestellen, sofort verschenken. Ab 49 €.",
      },
      {
        eyebrow: "Gutschein online",
        headline: "Bestellen. Drucken. Verschenken. In Minuten.",
        subline: "E-Gutschein sofort per E-Mail — kein Warten, kein Versandstress.",
        trust: `${siteConfig.business.rating}★ · Sofort per E-Mail`,
      },
      {
        eyebrow: "Digital schenken",
        headline: "E-Gutschein — sofort da, lange erinnert.",
        paragraphs: [
          "Gutschein online bestellen: in Minuten bestellt, sofort per E-Mail.",
          "PDF, Print@Home — Beschenkte bucht selbst den Termin.",
          "Fensterreinigung als Geschenk — Klarheit statt Staub.",
        ],
      },
      { closing: { cta: "Gutschein online bestellen", headline: "", text: "" } },
    ),
  fensterreinigung: () =>
    page(
      "fensterreinigung",
      {
        title: "Fensterreinigung Gutschein | Geschenk — Ilyashan",
        description: "Fensterreinigung Gutschein verschenken: streifenfrei, ab 49 €, sofort online. Region Aachen & Baesweiler.",
      },
      {
        eyebrow: "Fensterreinigung · Gutschein",
        headline: "Fensterreinigung schenken — Klarheit statt Chaos.",
        subline: "Der Gutschein für streifenfreie Fenster — sofort online.",
        trust: `${siteConfig.business.rating}★ · Ab 49 €`,
      },
      {
        eyebrow: "Das Original",
        headline: "Fensterreinigung Gutschein — der Klassiker.",
        paragraphs: [
          "Schenken Sie Entlastung: klare Fenster ohne eigene Arbeit.",
          "Privat ab 49 €, Rahmen ab 79 €, Solar ab 99 €.",
          "Einlösbar in Baesweiler und gesamter Region.",
        ],
      },
      { recipients: REGION_RECIPIENTS },
    ),
  reinigung: () =>
    page(
      "reinigung",
      {
        title: "Reinigungsgutschein | Putzservice Geschenk — Ilyashan",
        description: "Reinigungsgutschein für Fensterreinigung: streifenfrei, ab 49 €, sofort online.",
      },
      {
        eyebrow: "Reinigung · Geschenk",
        headline: "Reinigung schenken — die wirklich ankommt.",
        subline: "Putzservice-Gutschein für streifenfreie Fenster.",
        trust: `${siteConfig.business.rating}★ · Sofort online`,
      },
      {
        eyebrow: "Putzservice Geschenk",
        headline: "Nicht irgendeine Reinigung — Fensterprofis.",
        paragraphs: [
          "Reinigungsgutscheine gibt es viele — Fenster brauchen Profis.",
          "Streifenfrei garantiert, versichert, fair kalkuliert.",
          "Ab 49 € — sofort digital oder Print@Home.",
        ],
      },
      { recipients: REGION_RECIPIENTS },
    ),
  geschenkidee: () =>
    page(
      "geschenkidee",
      {
        title: "Geschenkidee Fensterreinigung | Originell — Ilyashan",
        description: "Geschenkidee gesucht? Fensterreinigung Gutschein — überraschend und nützlich. Ab 49 €, sofort online.",
      },
      {
        eyebrow: "Geschenkidee",
        headline: "Endlich eine Geschenkidee, die ankommt.",
        subline: "Originell, persönlich, nützlich — Fensterreinigung als Geschenk.",
        trust: `${siteConfig.business.rating}★ · Einzigartig`,
      },
      {
        eyebrow: "Die bessere Idee",
        headline: "Geschenkideen gibt es viele. Klarheit ist selten.",
        paragraphs: [
          "Parfum, Schokolade — vergessen. Klare Fenster bleiben.",
          "Für Menschen, die alles haben — aber keine Zeit.",
          "Premium und persönlich — Ilyashan Baesweiler.",
        ],
      },
    ),
  "zeit-schenken": () =>
    page(
      "zeit-schenken",
      {
        title: "Zeit schenken | Fensterreinigung Gutschein — Ilyashan",
        description: "Zeit schenken statt Dinge: Fensterreinigung Gutschein. Ab 49 €, sofort online.",
      },
      {
        eyebrow: "Zeit schenken",
        headline: "Sie schenken keine Stunde. Sie schenken Entlastung.",
        subline: "Zeit und Klarheit — Fensterreinigung als Geschenk.",
        trust: `${siteConfig.business.rating}★ · Zeit fürs Leben`,
      },
      {
        eyebrow: "Mehr als Zeit",
        headline: "Zeit für sich — oder für jemanden, den Sie lieben.",
        paragraphs: [
          "Kein weiteres Ding — echte Entlastung vom Alltag.",
          "Beschenkte lehnt sich zurück — wir erledigen den Rest.",
          "Gutschein online — sofort per E-Mail.",
        ],
      },
    ),
  selbstfuersorge: () =>
    page(
      "selbstfuersorge",
      {
        title: "Selbstfürsorge Geschenk | Fensterreinigung — Ilyashan",
        description: "Selbstfürsorge Geschenk: Fensterreinigung Gutschein für sich selbst. Ab 49 €.",
      },
      {
        eyebrow: "Selbstfürsorge",
        headline: "Self Care ist kein Luxus. Es ist Entlastung.",
        subline: "Gönnen Sie sich klare Fenster — ohne schlechtes Gewissen.",
        trust: `${siteConfig.business.rating}★ · Für Sie`,
      },
      {
        eyebrow: "Für Sie",
        headline: "Sie geben immer. Diesmal: empfangen.",
        paragraphs: [
          "Selbstfürsorge verschenken — oder selbst buchen.",
          "Keine Leiter, kein Eimer, keine Streifen.",
          "Gutschein online — sofort per E-Mail.",
        ],
      },
    ),
  premium: () =>
    page(
      "premium",
      {
        title: "Premium Geschenk | Fensterreinigung Komplett — Ilyashan",
        description: "Premium Geschenk: Rahmen & Falz ab 79 € oder Solar ab 99 €. Sofort online.",
      },
      {
        eyebrow: "Premium · Deluxe",
        headline: "Premium ist nicht laut. Premium ist Klarheit.",
        subline: "Komplettpaket Rahmen & Falz oder Solar — das volle Ergebnis.",
        trust: `${siteConfig.business.rating}★ · Ab 79 €`,
      },
      {
        eyebrow: "Premium verschenken",
        headline: "Hochwertig — ohne Protz.",
        paragraphs: [
          "Premium Gutschein: Rahmen & Falz (79 €) oder Solar (99 €).",
          "Streifenfrei garantiert — versichert.",
          "Sofort online bestellen.",
        ],
      },
    ),
  "fensterreinigung-nrw": () =>
    page(
      "fensterreinigung-nrw",
      {
        title: "Fensterreinigung Gutschein NRW | Region Aachen — Ilyashan",
        description: "Fensterreinigung Gutschein NRW: Städteregion Aachen & Kreis Heinsberg. Ab 49 € · Sofort online.",
      },
      {
        eyebrow: "Gutschein · NRW",
        headline: "NRW schenken — Klarheit statt Staub.",
        subline: "Einlösbar in Baesweiler — gut erreichbar aus der ganzen Region.",
        trust: `${siteConfig.business.rating}★ · Region Aachen`,
      },
      {
        eyebrow: "Regional",
        headline: "Ein Team. Die ganze Region.",
        paragraphs: [
          "Bundesweit verschenkbar — einlösbar bei Ilyashan in Baesweiler.",
          "Aachen, Baesweiler, Würselen, Eschweiler, Stolberg und mehr.",
          "Kein Anfahrtszuschlag im Einsatzgebiet.",
        ],
      },
      { recipients: REGION_RECIPIENTS },
    ),
  "fuer-mama": () =>
    page("fuer-mama", { title: "Geschenk für Mama | Fensterreinigung — Ilyashan", description: "Geschenk für Mama: Fensterreinigung Gutschein — Entlastung statt Staub. Ab 49 €." }, { eyebrow: "Geschenk · Mama", headline: "Mama gibt immer. Diesmal: empfangen.", subline: "Fensterreinigung Gutschein — Zeit nur für sie.", trust: `${siteConfig.business.rating}★ · Für Mama` }, { eyebrow: "Danke, Mama", headline: "Blumen welken. Klarheit bleibt.", paragraphs: ["Mama verdient Entlastung — klare Fenster statt Standard-Geschenk.", "Auch /gutschein/muttertag — ab 49 €.", "Region Aachen — gut erreichbar."] }),
  "fuer-papa": () =>
    page("fuer-papa", { title: "Geschenk für Papa | Fensterreinigung — Ilyashan", description: "Geschenk für Papa: Fensterreinigung — Entlastung statt Werkzeug. Ab 49 €." }, { eyebrow: "Geschenk · Papa", headline: "Papa trägt viel. Schenken Sie Klarheit.", subline: "Fensterreinigung Gutschein — praktisch und überraschend.", trust: `${siteConfig.business.rating}★ · Für Papa` }, { eyebrow: "Ruhe statt Werkzeug", headline: "Kein weiteres Gadget.", paragraphs: ["Entlastung statt Krawatte — Papa wird überrascht sein.", "Auch /gutschein/vatertag.", "Ab 49 € — sofort online."] }),
  "fuer-oma": () =>
    page("fuer-oma", { title: "Geschenk für Oma | Fensterreinigung — Ilyashan", description: "Geschenk für Oma: Fensterreinigung Gutschein — Wertschätzung spürbar. Ab 49 €." }, { eyebrow: "Geschenk · Oma", headline: "Oma hat so viel gegeben. Jetzt: empfangen.", subline: "Sanfte Entlastung — klare Fenster ohne eigene Arbeit.", trust: `${siteConfig.business.rating}★ · Für Oma` }, { eyebrow: "Generationen", headline: "Von der ganzen Familie.", paragraphs: ["Wertschätzung spürbar — praktisches Oma-Geschenk.", "Ab 49 €.", "Herzlicher Service in Baesweiler."] }),
  "fuer-opa": () =>
    page("fuer-opa", { title: "Geschenk für Opa | Fensterreinigung — Ilyashan", description: "Geschenk für Opa: Fensterreinigung — praktisch und seriös. Ab 49 €." }, { eyebrow: "Geschenk · Opa", headline: "Opa verdient Entlastung.", subline: "Fensterreinigung Gutschein — kein Schnickschnack.", trust: `${siteConfig.business.rating}★ · Für Opa` }, { eyebrow: "Respekt", headline: "Wertschätzung — spürbar.", paragraphs: ["Opa freut sich über echte Aufmerksamkeit.", "Ab 49 € — 45 Minuten Überraschung.", "Region Aachen."] }),
  "fuer-freund": () =>
    page("fuer-freund", { title: "Geschenk für Freund | Fensterreinigung — Ilyashan", description: "Geschenk für Freund: Fensterreinigung Gutschein — praktisch & überraschend. Ab 49 €." }, { eyebrow: "Geschenk · Freund", headline: "Für den Freund, der alles mitträgt.", subline: "Entlastung schenken — praktisch und unerwartet.", trust: `${siteConfig.business.rating}★ · Neutral` }, { eyebrow: "Freundschaft", headline: "Sie kennen ihn. Er braucht Zeit.", paragraphs: ["Geburtstag, Danke, Überraschung — passt immer.", "Ab 49 €.", "Praktisch und originell."] }),
  silberhochzeit: () =>
    page("silberhochzeit", { title: "Silberhochzeit Geschenk | Fensterreinigung — Ilyashan", description: "Geschenk zur Silberhochzeit: Fensterreinigung Gutschein — Entlastung zu zweit. Ab 79 €." }, { eyebrow: "Silberhochzeit", headline: "25 Jahre — schenken Sie Klarheit.", subline: "Gemeinsam entspannen — wir putzen die Fenster.", trust: `${siteConfig.business.rating}★ · Ab 79 €` }, { eyebrow: "Silberne Hochzeit", headline: "Nicht Porzellan. Ein Gefühl.", paragraphs: ["Rahmen & Falz ab 79 € — beliebt für Paare.", "Entlastung statt Staub.", "Siehe /gutschein/jubilaeum."] }),
  nikolaus: () =>
    page("nikolaus", { title: "Nikolaus Geschenk | Fensterreinigung — Ilyashan", description: "Nikolaus Geschenk: Fensterreinigung Gutschein — originell statt Süßigkeiten. Sofort online." }, { eyebrow: "Nikolaus", headline: "Nikolaus bringt Klarheit.", subline: "Originell, sofort per E-Mail — ideal am 5. Dezember.", trust: `${siteConfig.business.rating}★ · Last Minute` }, { eyebrow: "Anders als Süßes", headline: "Schokolade schmilzt. Klarheit bleibt.", paragraphs: ["Für Mama, Papa, Partner — ab 49 €.", "Sofort bestellbar.", "Region Aachen."] }),
  verlobung: () =>
    page("verlobung", { title: "Verlobung Geschenk | Fensterreinigung — Ilyashan", description: "Geschenk zur Verlobung: Fensterreinigung Gutschein — Entlastung vor dem Trubel. Ab 79 €." }, { eyebrow: "Verlobung", headline: "Vor dem Trubel — Klarheit zu zweit.", subline: "Entlastung schenken — bevor die Planung beginnt.", trust: `${siteConfig.business.rating}★ · Ab 79 €` }, { eyebrow: "Glückwunsch", headline: "Ihr Ja verdient Ruhe.", paragraphs: ["Rahmen & Falz ab 79 € — für das neue Zuhause.", "Zeit zu zweit schenken.", "Siehe /gutschein/hochzeit."] }),
  ueberraschung: () =>
    page("ueberraschung", { title: "Überraschungsgeschenk | Fensterreinigung — Ilyashan", description: "Überraschungsgeschenk: Fensterreinigung Gutschein — unerwartet und nützlich. Ab 49 €." }, { eyebrow: "Überraschung", headline: "Nicht erwartet. Nicht vergessen.", subline: "Fensterreinigung statt Standard — Wow-Garantie.", trust: `${siteConfig.business.rating}★ · Einzigartig` }, { eyebrow: "Das unerwartete Geschenk", headline: "Sie erwartet Blumen. Sie bekommt Klarheit.", paragraphs: ["Digital in 2 Minuten — Überraschung garantiert.", "Praktisch und originell.", "Siehe /gutschein/last-minute."] }),
};

export const BUILT_GIFT_SLUGS = [
  "online",
  "fensterreinigung",
  "reinigung",
  "geschenkidee",
  "zeit-schenken",
  "selbstfuersorge",
  "premium",
  "fensterreinigung-nrw",
  "fuer-mama",
  "fuer-papa",
  "fuer-oma",
  "fuer-opa",
  "fuer-freund",
  "silberhochzeit",
  "nikolaus",
  "verlobung",
  "ueberraschung",
] as const;

export type BuiltGiftSlug = (typeof BUILT_GIFT_SLUGS)[number];

export function buildGiftPage(slug: string): BuiltGiftPage | null {
  const builder = BUILDERS[slug];
  if (!builder) return null;
  return builder();
}
