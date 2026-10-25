import type { QuoteFormData } from "@/lib/quote-form";
import {
  cleaningSideLabels,
  dirtLevelLabels,
  getFloorLabel,
  quoteServiceLabels,
} from "@/lib/quote-form";
import { calculatePriceEstimate, formatEuro } from "@/lib/pricing";
import { siteConfig } from "@/lib/config";
import type { ConciergeSession } from "./types";
import { quoteDataForEstimate } from "./pricing-response";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import {
  getTreppenhausDraft,
  isTreppenhausComplete,
} from "@/lib/assistant/dialog/treppenhaus";
import {
  calculateTreppenhausQuote,
  formatEuroFromCents,
} from "@/lib/treppenhaus/pricing";

export function buildConciergeWhatsAppMessage(
  session: ConciergeSession,
  ctx: QuotePricingContext = defaultQuotePricingContext()
): string {
  const q = session.quote;
  const lines: string[] = [
    "Guten Tag, ich habe über den Ilyashan Website-Assistenten eine Anfrage:",
    "",
  ];

  if (session.assistantProduct) {
    lines.push(`Produkt: ${session.assistantProduct}`);
  }

  if (q.services?.length) {
    lines.push(`Leistung: ${q.services.map((s) => quoteServiceLabels[s]).join(", ")}`);
  }
  if (q.windowCount && q.windowCount > 0) {
    lines.push(`Fensterflügel: ${q.windowCount}`);
  }
  if (q.floorLevel) {
    lines.push(`Etage: ${getFloorLabel(q as Pick<QuoteFormData, "floorLevel">)}`);
  }
  if (q.cleaningSide) {
    lines.push(`Umfang: ${cleaningSideLabels[q.cleaningSide]}`);
  }
  if (q.dirtLevel) {
    lines.push(`Verschmutzung: ${dirtLevelLabels[q.dirtLevel]}`);
  }
  if (q.postalCode || q.city) {
    lines.push(`Ort: ${[q.postalCode, q.city].filter(Boolean).join(" ")}`);
  }

  if (session.bueroDraft?.totalAreaM2) {
    lines.push(`Büro: ca. ${session.bueroDraft.totalAreaM2} m²`);
    if (session.bueroDraft.frequency) {
      lines.push(`Büro-Turnus: ${session.bueroDraft.frequency}`);
    }
  }

  const trp = getTreppenhausDraft(session);
  if (session.assistantProduct === "treppenhaus" || Object.keys(trp).length > 0) {
    if (trp.stockwerke) lines.push(`Stockwerke: ${trp.stockwerke}`);
    if (trp.wohnungen) lines.push(`Wohnungen: ${trp.wohnungen}`);
    if (trp.stairTurnus) lines.push(`Treppen-Turnus: ${trp.stairTurnus}`);
    if (isTreppenhausComplete(trp)) {
      const quote = calculateTreppenhausQuote(trp);
      lines.push(
        `Treppenhaus-Orientierung brutto/Monat: ca. ${formatEuroFromCents(quote.monthlyGrossCents)}`
      );
    }
  }

  if (session.salesNotes?.trim()) {
    lines.push(`Notiz: ${session.salesNotes.trim()}`);
  }

  const estimateData = quoteDataForEstimate(q);
  if (estimateData) {
    const estimate = calculatePriceEstimate(
      estimateData,
      ctx.pricingOverrides,
      ctx.wartungConfig
    );
    if (estimate && estimate.amount > 0) {
      lines.push(
        `${siteConfig.messaging.priceEstimateRowLabel}: ca. ${formatEuro(estimate.min)}–${formatEuro(estimate.max)} (unverbindlich)`
      );
    }
  }

  lines.push("", "Bitte um verbindliches Festpreis-Angebot und Terminvorschlag. Vielen Dank!");
  return lines.join("\n");
}

export function getConciergeWhatsAppUrl(
  session: ConciergeSession,
  ctx: QuotePricingContext = defaultQuotePricingContext()
): string {
  const text = encodeURIComponent(buildConciergeWhatsAppMessage(session, ctx));
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${text}`;
}
