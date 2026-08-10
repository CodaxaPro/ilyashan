import { siteConfig } from "@/lib/config";
import { formatFestpreisDisplay } from "@/lib/vat-display";
import type { PriceAudience } from "@/lib/vat-display";

export function cleanLeadPhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^0/, "49").replace(/^\+/, "");
}

export interface LeadQuickReplyInput {
  name: string;
  phone?: string;
  email?: string;
  anfrageNr: string;
  services: string;
  /** Admin-set binding Festpreis (brutto Endpreis). */
  festpreis?: number;
  audience: PriceAudience;
  /**
   * Fallback when Festpreis not set yet (inbound lead email).
   * Must already include MwSt wording if shown to customer.
   */
  estimateLabel?: string;
}

export interface LeadQuickReplyLinks {
  callHref: string | null;
  whatsappHref: string | null;
  mailtoHref: string | null;
  /** Customer-facing price line used in WA / mailto. */
  priceLabel: string;
  /** true when priceLabel is the admin Festpreis. */
  isFestpreis: boolean;
}

function resolveOfferPrice(input: LeadQuickReplyInput): {
  priceLabel: string;
  isFestpreis: boolean;
} {
  if (typeof input.festpreis === "number" && Number.isFinite(input.festpreis) && input.festpreis > 0) {
    return {
      priceLabel: formatFestpreisDisplay(input.festpreis, input.audience),
      isFestpreis: true,
    };
  }
  const estimate = input.estimateLabel?.trim();
  if (estimate) {
    return { priceLabel: estimate, isFestpreis: false };
  }
  return { priceLabel: "folgt", isFestpreis: false };
}

export function buildLeadOfferMailtoBody(
  name: string,
  services: string,
  priceLabel: string,
  isFestpreis: boolean
): string {
  const priceLine = isFestpreis
    ? `Ihr verbindlicher Festpreis: ${priceLabel}`
    : `Ihre unverbindliche Preisschätzung: ${priceLabel || "___ €"}`;

  return [
    `Guten Tag ${name},`,
    "",
    "vielen Dank für Ihre Anfrage bei Ilyashan Fensterreinigung.",
    "",
    `Angefragte Leistung: ${services}`,
    priceLine,
    "Vorgeschlagener Termin: ___________",
    "",
    "Bei Rückfragen stehe ich Ihnen jederzeit gerne zur Verfügung.",
    "",
    "Mit freundlichen Grüßen",
    "Ilyashan Fensterreinigung",
    siteConfig.contact.phoneDisplay,
    siteConfig.contact.email,
  ].join("\n");
}

export function buildLeadOfferWhatsAppText(
  name: string,
  services: string,
  priceLabel: string,
  isFestpreis: boolean
): string {
  if (isFestpreis) {
    return `Guten Tag ${name}, vielen Dank für Ihre Anfrage (${services}). Ihr verbindlicher Festpreis: ${priceLabel}. Freundliche Grüße – Ilyashan Fensterreinigung`;
  }
  return `Guten Tag ${name}, vielen Dank für Ihre Anfrage (${services}). Unverbindliche Preisschätzung: ${priceLabel || "folgt"}. Freundliche Grüße – Ilyashan Fensterreinigung`;
}

/** Shared Schnellantwort links for admin email + admin panel. */
export function buildLeadQuickReplyLinks(input: LeadQuickReplyInput): LeadQuickReplyLinks {
  const { priceLabel, isFestpreis } = resolveOfferPrice(input);
  const phone = input.phone?.trim();
  const email = input.email?.trim();

  const callHref = phone ? `tel:${phone}` : null;

  const whatsappHref = phone
    ? `https://wa.me/${cleanLeadPhone(phone)}?text=${encodeURIComponent(
        buildLeadOfferWhatsAppText(input.name, input.services, priceLabel, isFestpreis)
      )}`
    : null;

  const mailtoHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(
        `Ihr Angebot ${input.anfrageNr} – Ilyashan Fensterreinigung`
      )}&body=${encodeURIComponent(
        buildLeadOfferMailtoBody(input.name, input.services, priceLabel, isFestpreis)
      )}`
    : null;

  return { callHref, whatsappHref, mailtoHref, priceLabel, isFestpreis };
}
