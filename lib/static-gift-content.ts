import type { BuiltGiftPage } from "./gift-builders";
import { buildGiftPage } from "./gift-builders";
import { siteConfig } from "./config";

export const STATIC_GIFT_SLUGS = [
  "fensterreinigung-geschenk",
  "muttertag",
  "weihnachten",
  "valentinstag",
  "paar",
  "geburtstag",
  "freundin",
  "vatertag",
  "ostern",
  "last-minute",
  "danke",
  "hochzeit",
  "jubilaeum",
  "abschied",
  "firmen-geschenk",
  "ruhestand",
  "team-geschenk",
] as const;

export type StaticGiftSlug = (typeof STATIC_GIFT_SLUGS)[number];

type OccasionDef = {
  slug: StaticGiftSlug;
  title: string;
  eyebrow: string;
  headline: string;
  subline: string;
  essenceHeadline: string;
  paragraphs: string[];
};

const OCCASIONS: OccasionDef[] = [
  {
    slug: "fensterreinigung-geschenk",
    title: "Fensterreinigung Geschenk | Gutschein — Ilyashan",
    eyebrow: "Fensterreinigung · Geschenk",
    headline: "Sie schenken keine Reinigung. Sie schenken Zeit und Klarheit.",
    subline: "Ein Gutschein für streifenfreie Fenster — sofort online, per E-Mail, Print@Home.",
    essenceHeadline: "Hinter dem Gutschein steckt Entlastung — nicht nur eine Leistung.",
    paragraphs: [
      "Die meisten Geschenke landen im Schrank. Dieses hier landet im Alltag — als Klarheit, Leichtigkeit und das Gefühl, endlich durchblicken zu können.",
      "Fensterreinigung ist der Rahmen. Was Sie wirklich schenken: Zeit, die niemand mehr an der Leiter verbringt.",
      "Ob für Mama, Partner oder Freundin — Sie schenken Entlastung, die man spürt.",
    ],
  },
  {
    slug: "muttertag",
    title: "Muttertag Geschenk | Fensterreinigung Gutschein — Ilyashan",
    eyebrow: "Muttertag · Geschenk",
    headline: "Mama gibt immer. Diesmal: empfangen.",
    subline: "Fensterreinigung Gutschein zum Muttertag — Entlastung statt Staub.",
    essenceHeadline: "Danke sagen — mit Klarheit statt Blumen.",
    paragraphs: [
      "Blumen welken. Klare Fenster bleiben — und Mama muss nicht selbst putzen.",
      "Ab 49 € — sofort online, Print@Home.",
      "Einlösbar in Baesweiler und gesamter Region Aachen.",
    ],
  },
  {
    slug: "weihnachten",
    title: "Weihnachtsgeschenk | Fensterreinigung Gutschein — Ilyashan",
    eyebrow: "Weihnachten · Geschenk",
    headline: "Stille unter dem Baum — Klarheit im neuen Jahr.",
    subline: "Weihnachtsgeschenk, das wirklich hilft: streifenfreie Fenster.",
    essenceHeadline: "Kein Staub unter dem Baum — Entlastung schenken.",
    paragraphs: [
      "Während andere Staub sammeln, schenken Sie Klarheit.",
      "Sofort per E-Mail — ideal auch last minute.",
      `${siteConfig.business.rating}★ · versichert · ab 49 €.`,
    ],
  },
  {
    slug: "valentinstag",
    title: "Valentinstag Geschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Valentinstag · Geschenk",
    headline: "Liebe zeigt sich in kleinen Entlastungen.",
    subline: "Valentinstags-Gutschein — Zeit zu zweit statt Leiter stemmen.",
    essenceHeadline: "Romantisch? Praktisch? Beides.",
    paragraphs: [
      "Schenken Sie gemeinsame Zeit — ohne Fenster putzen.",
      "Ab 49 € — sofort online.",
      "Auch für Singles: Selbstfürsorge als Geschenk.",
    ],
  },
  {
    slug: "paar",
    title: "Geschenk für Paare | Fensterreinigung — Ilyashan",
    eyebrow: "Paar · Geschenk",
    headline: "Gemeinsam entspannen — wir putzen.",
    subline: "Fensterreinigung Gutschein für Paare — Entlastung zu zweit.",
    essenceHeadline: "Zeit zu zweit — ohne Hausarbeit.",
    paragraphs: [
      "Rahmen & Falz ab 79 € — perfekt für das gemeinsame Zuhause.",
      "Streifenfrei garantiert.",
      "Einlösbar in der gesamten Region.",
    ],
  },
  {
    slug: "geburtstag",
    title: "Geburtstagsgeschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Geburtstag · Geschenk",
    headline: "Stille statt Staub — das Geschenk, das bleibt.",
    subline: "Geburtstags-Gutschein für klare Fenster.",
    essenceHeadline: "Originell und nützlich.",
    paragraphs: [
      "Kein weiteres Ding — echte Entlastung.",
      "Ab 49 € — sofort per E-Mail.",
      "Überraschend und unvergesslich.",
    ],
  },
  {
    slug: "freundin",
    title: "Geschenk für Freundin | Fensterreinigung — Ilyashan",
    eyebrow: "Freundin · Geschenk",
    headline: "Sie trägt alles — schenken Sie Klarheit.",
    subline: "Fensterreinigung Gutschein für die beste Freundin.",
    essenceHeadline: "Wertschätzung, die ankommt.",
    paragraphs: [
      "Die Freundin, die immer für alle da ist — verdient Pause.",
      "Ab 49 € — sofort online.",
      `${siteConfig.business.rating}★ bei Google.`,
    ],
  },
  {
    slug: "vatertag",
    title: "Vatertagsgeschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Vatertag · Geschenk",
    headline: "Ruhe statt Werkzeug — für Papa.",
    subline: "Vatertags-Gutschein — praktisch und überraschend.",
    essenceHeadline: "Keine weitere Krawatte.",
    paragraphs: [
      "Papa freut sich über echte Entlastung.",
      "Ab 49 € — sofort online.",
      "Praktisch, seriös, originell.",
    ],
  },
  {
    slug: "ostern",
    title: "Ostergeschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Ostern · Geschenk",
    headline: "Schokolade schmilzt. Klarheit bleibt.",
    subline: "Oster-Gutschein — frisch in den Frühling.",
    essenceHeadline: "Frühling mit klaren Fenstern.",
    paragraphs: [
      "Frühlingsputz? Wir übernehmen.",
      "Sofort per E-Mail — ideal als Osterüberraschung.",
      "Ab 49 €.",
    ],
  },
  {
    slug: "last-minute",
    title: "Last Minute Geschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Last Minute · Geschenk",
    headline: "In 2 Minuten bestellt — sofort per E-Mail.",
    subline: "Last-Minute-Gutschein — Print@Home, digital, sofort.",
    essenceHeadline: "Keine Zeit? Kein Problem.",
    paragraphs: [
      "Gutschein sofort nach Bestellung per E-Mail.",
      "Ausdrucken, weiterleiten, fertig.",
      "Ab 49 € — jederzeit bestellbar.",
    ],
  },
  {
    slug: "danke",
    title: "Dankeschön Geschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Danke · Geschenk",
    headline: "Danke sagen — mit Klarheit.",
    subline: "Dankeschön-Gutschein — Wertschätzung, die man spürt.",
    essenceHeadline: "Mehr als Worte.",
    paragraphs: [
      "Für Nachbarn, Helfer, Freunde — praktisch und herzlich.",
      "Ab 49 € — sofort online.",
      "Ein Geschenk, das ankommt.",
    ],
  },
  {
    slug: "hochzeit",
    title: "Hochzeitsgeschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Hochzeit · Geschenk",
    headline: "Nach dem Ja — Klarheit im neuen Zuhause.",
    subline: "Hochzeits-Gutschein — praktisch und originell.",
    essenceHeadline: "Kein Porzellan — echte Hilfe.",
    paragraphs: [
      "Das neue Heim verdient klare Fenster.",
      "Rahmen & Falz ab 79 € — beliebt für Paare.",
      "Sofort online bestellbar.",
    ],
  },
  {
    slug: "jubilaeum",
    title: "Jubiläum Geschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Jubiläum · Geschenk",
    headline: "Jahre zusammen — Zeit füreinander schenken.",
    subline: "Jubiläums-Gutschein — Entlastung zu zweit.",
    essenceHeadline: "Ihr seid es wert.",
    paragraphs: [
      "Gemeinsam entspannen — wir erledigen die Fenster.",
      "Ab 79 € — Komplettpaket.",
      "Region Aachen & Baesweiler.",
    ],
  },
  {
    slug: "abschied",
    title: "Abschiedsgeschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Abschied · Geschenk",
    headline: "Danke sagen — Kollegin, Team, Nachbar.",
    subline: "Abschieds-Gutschein — Wertschätzung spürbar.",
    essenceHeadline: "Ein Abschied, der bleibt.",
    paragraphs: [
      "Für Kolleginnen, Nachbarn, Freunde — praktisch und persönlich.",
      "Ab 49 € — sofort online.",
      "Originell statt Standard.",
    ],
  },
  {
    slug: "firmen-geschenk",
    title: "Firmengeschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Firma · Geschenk",
    headline: "Mitarbeiter wertschätzen — praktisch.",
    subline: "Firmengeschenk Fensterreinigung — auch als Teamevent-Ersatz.",
    essenceHeadline: "Wertschätzung für Ihr Team.",
    paragraphs: [
      "Mehrere Gutscheine bestellbar — für Mitarbeiter und Kunden.",
      "Gewerbe und Privat — flexibel einlösbar.",
      "Ab 49 € pro Gutschein.",
    ],
  },
  {
    slug: "ruhestand",
    title: "Ruhestand Geschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Ruhestand · Geschenk",
    headline: "Endlich Zeit — ohne Leiter.",
    subline: "Ruhestands-Gutschein — Entlastung für den neuen Lebensabschnitt.",
    essenceHeadline: "Genießen statt putzen.",
    paragraphs: [
      "Im Ruhestand keine Leiter mehr — wir übernehmen.",
      "Ab 49 € — sofort online.",
      "Herzliches Geschenk von der Familie.",
    ],
  },
  {
    slug: "team-geschenk",
    title: "Team-Geschenk | Fensterreinigung — Ilyashan",
    eyebrow: "Team · Geschenk",
    headline: "Team wertschätzen — praktisch statt Event.",
    subline: "Team-Gutscheine — Entlastung für Kolleginnen und Kollegen.",
    essenceHeadline: "Ruhe statt Teambuilding-Pflicht.",
    paragraphs: [
      "Mehrere Gutscheine auf einmal bestellbar.",
      "Praktisch, originell, fair.",
      "Ab 49 € — sofort per E-Mail.",
    ],
  },
];

function toGiftPage(o: OccasionDef): BuiltGiftPage {
  const base = buildGiftPage("fensterreinigung")!;
  return {
    ...base,
    slug: o.slug,
    path: `/gutschein/${o.slug}`,
    seo: { title: o.title, description: o.subline + ` Ab 49 € · ${siteConfig.business.rating}★ · Ilyashan.` },
    hero: { eyebrow: o.eyebrow, headline: o.headline, subline: o.subline, trust: base.hero.trust },
    essence: { eyebrow: "Was Sie schenken", headline: o.essenceHeadline, paragraphs: o.paragraphs },
    closing: { headline: o.headline, text: o.subline, cta: "Gutschein bestellen" },
  };
}

const STATIC_PAGES: Record<StaticGiftSlug, BuiltGiftPage> = Object.fromEntries(
  OCCASIONS.map((o) => [o.slug, toGiftPage(o)]),
) as Record<StaticGiftSlug, BuiltGiftPage>;

export function getStaticGiftPage(slug: string): BuiltGiftPage | null {
  if (slug in STATIC_PAGES) return STATIC_PAGES[slug as StaticGiftSlug];
  return null;
}
