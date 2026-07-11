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
import { calculatePriceEstimate, formatEuro } from "@/lib/pricing";
import { siteConfig } from "@/lib/config";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";

export function buildWhatsAppQuoteMessage(
  data: QuoteFormData,
  ctx: QuotePricingContext = defaultQuotePricingContext()
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
  const priceLine = estimate
    ? estimate.amount > 0
      ? `${siteConfig.messaging.priceEstimateRowLabel}: ca. ${formatEuro(estimate.min)}–${formatEuro(estimate.max)} (unverbindlich)`
      : `Preis: ${estimate.label}`
    : "";

  const objectLabel = data.objectType
    ? data.objectType === "sonstiges"
      ? data.objectTypeOther || "Sonstiges"
      : objectTypeLabels[data.objectType]
    : "";

  const lines = [
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
  ].filter(Boolean);

  return lines.join("\n");
}

export function getWhatsAppQuoteUrl(
  data: QuoteFormData,
  ctx: QuotePricingContext = defaultQuotePricingContext()
) {
  const text = encodeURIComponent(buildWhatsAppQuoteMessage(data, ctx));
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${text}`;
}
