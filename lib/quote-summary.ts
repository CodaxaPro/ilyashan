import { siteConfig } from "@/lib/config";
import type { QuoteFormData } from "@/lib/quote-form";
import {
  cleaningSideLabels,
  dirtLevelLabels,
  elevatorLabels,
  formatGermanDate,
  getFloorLabel,
  objectTypeLabels,
  quoteServiceLabels,
  scheduleOptionLabels,
} from "@/lib/quote-form";
import { calculatePriceEstimate, formatEuro } from "@/lib/pricing";

const reinigungsLabels: { key: keyof QuoteFormData; label: string }[] = [
  { key: "withFrame", label: "Mit Rahmen" },
  { key: "withFalz", label: "Fugen & Falz" },
  { key: "windowSills", label: "Fensterbänke" },
  { key: "muntinWindows", label: "Sprossenfenster" },
  { key: "oldBuildingWindows", label: "Altbaufenster" },
  { key: "skylights", label: "Oberlichter / Dachfenster" },
  { key: "shutters", label: "Rollladen" },
  { key: "blinds", label: "Jalousien" },
  { key: "canopy", label: "Vordach" },
  { key: "flyScreens", label: "Fliegengitter" },
];

export function generateAnfrageNr() {
  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-6);
  return `ANG-${year}-${seq}`;
}

export function getQuoteContactName(data: QuoteFormData) {
  return `${data.firstName} ${data.lastName}`.trim();
}

export function getQuotePlzOrt(data: QuoteFormData) {
  return `${data.postalCode} ${data.city}`.trim();
}

export function getObjectLabel(data: QuoteFormData) {
  if (!data.objectType) return "–";
  if (data.objectType === "sonstiges") return data.objectTypeOther || "Sonstiges";
  return objectTypeLabels[data.objectType];
}

export function getServicesLabel(data: QuoteFormData) {
  const parts = data.services.map((s) => quoteServiceLabels[s]);
  if (data.includeSolar) parts.push(`Solar (${data.solarSqm} m²)`);
  if (data.includeWintergarden) parts.push(`Wintergarten (${data.wintergardenSqm} m²)`);
  return parts.join(", ") || "–";
}

export function getReinigungswünscheLabel(data: QuoteFormData) {
  const selected = reinigungsLabels.filter((item) => data[item.key] === true).map((i) => i.label);
  return selected.length > 0 ? selected.join(", ") : "–";
}

export function getPriceLabel(data: QuoteFormData) {
  const estimate = calculatePriceEstimate(data);
  if (!estimate) return "–";
  if (estimate.amount > 0) {
    return `ca. ${formatEuro(estimate.min)} – ${formatEuro(estimate.max)}`;
  }
  return `${formatEuro(estimate.min)} – ${formatEuro(estimate.max)} (${estimate.label})`;
}

export function getTerminLabel(data: QuoteFormData) {
  if (!data.scheduleOption) return "–";
  let label = scheduleOptionLabels[data.scheduleOption];
  if (data.preferredDates.length > 0) {
    label += `: ${data.preferredDates.map(formatGermanDate).join(", ")}`;
  }
  return label;
}

export function buildQuoteTableRows(data: QuoteFormData, anfrageNr: string): [string, string][] {
  const rows: [string, string][] = [
    ["Anfrage-Nr.", anfrageNr],
    ["Leistungen", getServicesLabel(data)],
    ["Objektart", getObjectLabel(data)],
    ["Etage", getFloorLabel(data)],
    ["Aufzug", data.elevator ? elevatorLabels[data.elevator] : "–"],
    ["Fensterflügel", String(data.windowCount)],
    ["Raumhöhe", `${data.roomHeight} m`],
    ["Verschmutzung", dirtLevelLabels[data.dirtLevel]],
    ["Reinigungsumfang", cleaningSideLabels[data.cleaningSide]],
    ["Reinigungswünsche", getReinigungswünscheLabel(data)],
    ["Wunschtermin", getTerminLabel(data)],
    [siteConfig.messaging.priceEstimateRowLabel, getPriceLabel(data)],
  ];

  if (data.narrowStairs) rows.push(["Zugang", "Enge Treppe (+15 €)"]);
  if (data.accessTimesNote) rows.push(["Zugangszeiten", data.accessTimesNote]);
  if (data.specialNotes) rows.push(["Besonderheiten", data.specialNotes]);
  if (data.additionalInfo) rows.push(["Zusatzinfo", data.additionalInfo]);

  return rows;
}

export function buildQuoteContactRows(data: QuoteFormData): [string, string][] {
  const name = [data.salutation, data.firstName, data.lastName].filter(Boolean).join(" ");
  return [
    ["Name", name || "–"],
    ["Telefon", data.phone || "–"],
    ["E-Mail", data.email || "–"],
    ["PLZ / Ort", getQuotePlzOrt(data) || "–"],
  ];
}

export function buildQuotePlainText(data: QuoteFormData, anfrageNr: string) {
  const allRows = [...buildQuoteContactRows(data), ...buildQuoteTableRows(data, anfrageNr)];
  return allRows.map(([k, v]) => `${k}: ${v}`).join("\n");
}
