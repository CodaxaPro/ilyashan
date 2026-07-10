export const QUOTE_STEPS = [
  { id: 1, label: "Leistung" },
  { id: 2, label: "Objekt" },
  { id: 3, label: "Details" },
  { id: 4, label: "Termin" },
  { id: 5, label: "Kontakt" },
] as const;

/** Schritt 1: nur Hauptleistungen – Solar/Wintergarten in Schritt 3 */
export type QuoteServiceId = "privat" | "gewerbe" | "wartung";

export type ObjectType = "wohnung" | "haus" | "gewerbe" | "sonstiges";
export type ElevatorOption = "ja" | "nein" | "unbekannt";
export type FloorLevel = "eg" | "og1" | "og2" | "og3" | "og4" | "og5plus" | "dg";
export type CleaningSide = "innen_aussen" | "nur_aussen" | "nur_innen";
export type DirtLevel = "leicht" | "normal" | "stark" | "extrem";
export type ScheduleOption = "1-2_wochen" | "wunschtermine" | "unsicher";
export type SubmitMethod = "email" | "whatsapp";

export interface QuoteFormData {
  services: QuoteServiceId[];
  objectType: ObjectType | "";
  objectTypeOther: string;
  floorLevel: FloorLevel | "";
  elevator: ElevatorOption | "";
  narrowStairs: boolean;
  accessTimes: boolean;
  accessTimesNote: string;
  specialFeatures: boolean;
  specialNotes: string;
  windowCount: number;
  roomHeight: number;
  dirtLevel: DirtLevel;
  cleaningSide: CleaningSide;
  includeSolar: boolean;
  solarSqm: number;
  includeWintergarden: boolean;
  wintergardenSqm: number;
  withFrame: boolean;
  withFalz: boolean;
  windowSills: boolean;
  muntinWindows: boolean;
  oldBuildingWindows: boolean;
  skylights: boolean;
  shutters: boolean;
  blinds: boolean;
  canopy: boolean;
  canopySqm: number;
  flyScreens: boolean;
  additionalInfo: string;
  scheduleOption: ScheduleOption | "";
  preferredDates: string[];
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  privacyAccepted: boolean;
}

export const initialQuoteFormData: QuoteFormData = {
  services: [],
  objectType: "",
  objectTypeOther: "",
  floorLevel: "",
  elevator: "",
  narrowStairs: false,
  accessTimes: false,
  accessTimesNote: "",
  specialFeatures: false,
  specialNotes: "",
  windowCount: 8,
  roomHeight: 2.5,
  dirtLevel: "normal",
  cleaningSide: "innen_aussen",
  includeSolar: false,
  solarSqm: 0,
  includeWintergarden: false,
  wintergardenSqm: 0,
  withFrame: false,
  withFalz: false,
  windowSills: false,
  muntinWindows: false,
  oldBuildingWindows: false,
  skylights: false,
  shutters: false,
  blinds: false,
  canopy: false,
  canopySqm: 0,
  flyScreens: false,
  additionalInfo: "",
  scheduleOption: "",
  preferredDates: [],
  salutation: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  privacyAccepted: false,
};

export const quoteServices: {
  id: QuoteServiceId;
  title: string;
  description: string;
  priceHint: string;
  icon: string;
}[] = [
  {
    id: "privat",
    title: "Privathaushalt",
    description: "Wohnung & Haus – streifenfrei innen und außen",
    priceHint: "Live berechnet · ab 49 €",
    icon: "home",
  },
  {
    id: "gewerbe",
    title: "Gewerbe & Büro",
    description: "Büro, Praxis, Laden – flexible Termine",
    priceHint: "Live berechnet · ab 120 €",
    icon: "building",
  },
  {
    id: "wartung",
    title: "Wartungsvertrag",
    description: "Regelmäßige Reinigung mit −25 % Rabatt",
    priceHint: "Live berechnet · ab 59 €/Mo.",
    icon: "calendar",
  },
];

export const objectTypeLabels: Record<ObjectType, string> = {
  wohnung: "Wohnung",
  haus: "Haus",
  gewerbe: "Gewerbe",
  sonstiges: "Sonstiges",
};

export const floorLevelLabels: Record<FloorLevel, string> = {
  eg: "Erdgeschoss (EG)",
  og1: "1. Obergeschoss",
  og2: "2. Obergeschoss",
  og3: "3. Obergeschoss",
  og4: "4. Obergeschoss",
  og5plus: "5. OG oder höher",
  dg: "Dachgeschoss",
};

export const elevatorLabels: Record<ElevatorOption, string> = {
  ja: "Ja",
  nein: "Nein",
  unbekannt: "Weiß nicht",
};

export const dirtLevelLabels: Record<DirtLevel, string> = {
  leicht: "Leicht",
  normal: "Normal",
  stark: "Stark",
  extrem: "Extrem",
};

/** Markt-validierte Multiplikatoren (NRW-Durchschnitt, 20+ Quellen) */
export const dirtLevelHints: Record<DirtLevel, string> = {
  leicht: "×0,92",
  normal: "×1,00",
  stark: "×1,25",
  extrem: "×1,55",
};

export const cleaningSideLabels: Record<CleaningSide, string> = {
  innen_aussen: "Innen & Außen",
  nur_aussen: "Nur außen",
  nur_innen: "Nur innen",
};

export const cleaningSideHints: Record<CleaningSide, string> = {
  innen_aussen: "×1,00",
  nur_aussen: "×0,65",
  nur_innen: "×0,45",
};

export const scheduleOptionLabels: Record<ScheduleOption, string> = {
  "1-2_wochen": "In den nächsten 1–2 Wochen",
  wunschtermine: "Wunschtermine wählen",
  unsicher: "Noch nicht sicher",
};

export const quoteServiceLabels: Record<QuoteServiceId, string> = {
  privat: "Privathaushalt",
  gewerbe: "Gewerbefenster",
  wartung: "Wartungsvertrag",
};

/** Aufschläge pro Flügel – aus Marktforschung */
export const extraPriceHints: Record<string, string> = {
  withFrame: "+1,00 €/Flügel",
  withFalz: "+0,65 €/Flügel",
  windowSills: "+0,50 €/Flügel",
  muntinWindows: "+1,75 €/Flügel",
  oldBuildingWindows: "+2,50 €/Flügel",
  skylights: "+12,00 € pauschal",
  shutters: "+1,00 €/Flügel",
  blinds: "+1,25 €/Flügel",
  canopy: "ab 25 € / 5,00 €/m²",
  flyScreens: "+0,75 €/Flügel",
  narrowStairs: "+15,00 € pauschal",
};

export function formatGermanDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function getFloorLabel(data: Pick<QuoteFormData, "floorLevel">) {
  return data.floorLevel ? floorLevelLabels[data.floorLevel] : "–";
}
