import { routes } from "@/lib/routes";

export type CompanyService = {
  href: string;
  title: string;
  tag: string;
  line: string;
  nextHref: string;
  nextLabel: string;
  image: string;
  /** object-position so each photo feels distinct in the crop */
  imagePosition: string;
};

export const companyServices: CompanyService[] = [
  {
    href: routes.fensterreinigung,
    title: "Fensterreinigung",
    tag: "Sofortpreis",
    line: "Wohnung, Laden, Büro, Solaranlage und Glasfassade.",
    nextHref: routes.angebot,
    nextLabel: "Preis berechnen",
    image: "/images/fenster-vorher-nachher.jpg",
    imagePosition: "object-[center_40%]",
  },
  {
    href: routes.bueroreinigung,
    title: "Büroreinigung",
    tag: "Fläche online",
    line: "Boden, Schreibtische, Sanitär und Teeküche. Wiederkehrend.",
    nextHref: routes.bueroreinigungAngebot,
    nextLabel: "Fläche kalkulieren",
    image: "/images/bueroreinigung.jpg",
    imagePosition: "object-center",
  },
  {
    href: routes.treppenhausreinigung,
    title: "Treppenhausreinigung",
    tag: "Turnus online",
    line: "Stockwerke, Wohnungen und Keller. Orientierung online, Festpreis nach Prüfung.",
    nextHref: routes.treppenhausreinigungAngebot,
    nextLabel: "Preis kalkulieren",
    image: "/images/bauendreinigung.jpg",
    imagePosition: "object-[center_25%]",
  },
  {
    href: routes.bauendreinigung,
    title: "Bauendreinigung",
    tag: "Nach Übergabe",
    line: "Wenn die Handwerker draußen sind. Übergabe des Neubaus.",
    nextHref: `${routes.bauendreinigung}#anfrage`,
    nextLabel: "Anfrage",
    image: "/images/bauendreinigung.jpg",
    imagePosition: "object-[center_35%]",
  },
  {
    href: routes.renovierungsreinigung,
    title: "Renovierungsreinigung",
    tag: "Nach den Arbeiten",
    line: "Nach Farbe, Putz oder neuem Boden in bestehenden Räumen.",
    nextHref: `${routes.renovierungsreinigung}#anfrage`,
    nextLabel: "Anfrage",
    image: "/images/renovierungsreinigung.jpg",
    imagePosition: "object-[center_60%]",
  },
  {
    href: routes.praxisreinigung,
    title: "Praxisreinigung",
    tag: "Nach Hygieneplan",
    line: "Arzt, Zahnarzt und Physiotherapie nach Ihrem Hygieneplan.",
    nextHref: `${routes.praxisreinigung}#anfrage`,
    nextLabel: "Anfrage",
    image: "/images/praxisreinigung.jpg",
    imagePosition: "object-[30%_center]",
  },
  {
    href: routes.entruempelung,
    title: "Entrümpelung",
    tag: "Besenrein",
    line: "Wohnung leeren und besenrein übergeben. Kein Umzug.",
    nextHref: `${routes.entruempelung}#anfrage`,
    nextLabel: "Anfrage",
    image: "/images/entruempelung.jpg",
    imagePosition: "object-[center_70%]",
  },
];
