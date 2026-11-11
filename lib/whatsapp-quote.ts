import type { QuoteFormData } from "@/lib/quote-form";
import {
  cleaningSideLabels,
  dirtLevelLabels,
  elevatorLabels,
  getFloorLabel,
  objectTypeLabels,
  scheduleOptionLabels,
  formatGermanDate,
  quoteServiceLabels,
} from "@/lib/quote-form";
import { calculatePriceEstimate } from "@/lib/pricing";
import { siteConfig } from "@/lib/config";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import { formatEstimateRangeLabel, resolvePriceAudience } from "@/lib/vat-display";
import { getReinigungswünscheLabel } from "@/lib/quote-summary";

export type WhatsAppQuoteMeta = {
  anfrageNr?: string | null;
  photoCount?: number;
};

export function buildWhatsAppQuoteMessage(
  data: QuoteFormData,
  ctx: QuotePricingContext = defaultQuotePricingContext(),
  meta: WhatsAppQuoteMeta = {}
) {
  const services = data.services.map((s) => quoteServiceLabels[s]).join(", ") || "–";
  const addonParts: string[] = [];
  if (data.includeSolar && data.solarSqm) addonParts.push(`Solar ${data.solarSqm} m²`);
  if (data.includeWintergarden && data.wintergardenSqm)
    addonParts.push(`Wintergarten ${data.wintergardenSqm} m²`);
  const serviceLine = addonParts.length
    ? `${services}${services !== "–" ? ", " : ""}${addonParts.join(", ")}`
    : services;
  const estimate = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig);
  const audience = resolvePriceAudience(data);
  const priceLine = estimate
    ? estimate.amount > 0
      ? `${siteConfig.messaging.priceEstimateRowLabel}: ${formatEstimateRangeLabel(estimate.min, estimate.max, audience)} (unverbindlich)`
      : `Preis: ${estimate.label}`
    : "";

  const objectLabel = data.objectType
    ? data.objectType === "sonstiges"
      ? data.objectTypeOther || "Sonstiges"
      : objectTypeLabels[data.objectType]
    : "";

  const header: string[] = [];
  if (meta.anfrageNr) header.push(`Anfrage-Nr.: ${meta.anfrageNr}`);
  if (meta.photoCount && meta.photoCount > 0) {
    header.push(
      `Fotos: ${meta.photoCount} bereits an Ihr Team übermittelt (Admin/E-Mail) — hier nur Chat.`
    );
  }

  const lines = [
    ...header,
    header.length > 0 ? "" : null,
    "Guten Tag, ich möchte ein Angebot für Fensterreinigung anfragen:",
    "",
    `Leistung: ${serviceLine}`,
    objectLabel ? `Objekt: ${objectLabel}` : "",
    data.floorLevel ? `Etage: ${getFloorLabel(data)}` : "",
    data.elevator ? `Aufzug: ${elevatorLabels[data.elevator]}` : "",
    data.narrowStairs ? "Enge Treppe: Ja" : "",
    data.accessTimes && data.accessTimesNote
      ? `Zugangszeiten: ${data.accessTimesNote}`
      : "",
    data.specialNotes ? `Besonderheiten: ${data.specialNotes}` : "",
    data.windowCount ? `Fensterflügel: ${data.windowCount}` : "",
    data.roomHeight ? `Raumhöhe: ${data.roomHeight} m` : "",
    data.dirtLevel ? `Verschmutzung: ${dirtLevelLabels[data.dirtLevel]}` : "",
    data.cleaningSide ? `Umfang: ${cleaningSideLabels[data.cleaningSide]}` : "",
    (() => {
      const extras = getReinigungswünscheLabel(data);
      return extras !== "–" ? `Reinigungswünsche: ${extras}` : "";
    })(),
    data.scheduleOption
      ? `Termin: ${scheduleOptionLabels[data.scheduleOption]}`
      : "",
    data.preferredDates.length > 0
      ? `Wunschtermine: ${data.preferredDates.map(formatGermanDate).join(", ")}`
      : "",
    data.firstName || data.lastName
      ? `Name: ${[data.salutation, data.firstName, data.lastName].filter(Boolean).join(" ")}`
      : "",
    data.phone ? `Telefon: ${data.phone}` : "",
    data.postalCode || data.city
      ? `Adresse: ${data.postalCode} ${data.city}`.trim()
      : "",
    data.additionalInfo ? `Hinweis: ${data.additionalInfo}` : "",
    priceLine,
    "",
    "Freue mich auf Ihr Angebot!",
  ].filter((line): line is string => line !== null && line !== "");

  return lines.join("\n");
}

export function getWhatsAppQuoteUrl(
  data: QuoteFormData,
  ctx: QuotePricingContext = defaultQuotePricingContext(),
  meta: WhatsAppQuoteMeta = {}
) {
  const text = encodeURIComponent(buildWhatsAppQuoteMessage(data, ctx, meta));
  // api.whatsapp.com: konsistent mit Admin-Schnellantwort / Webmail
  return `https://api.whatsapp.com/send?phone=${siteConfig.contact.whatsapp}&text=${text}`;
}
