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

export function buildConciergeWhatsAppMessage(
  session: ConciergeSession,
  ctx: QuotePricingContext = defaultQuotePricingContext()
): string {
  const q = session.quote;
  const lines: string[] = [
    "Guten Tag, ich habe über den Ilyashan Website-Assistenten eine Anfrage:",
    "",
  ];

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

  lines.push("", "Bitte um verbindliches Festpreis-Angebot. Vielen Dank!");
  return lines.join("\n");
}

export function getConciergeWhatsAppUrl(
  session: ConciergeSession,
  ctx: QuotePricingContext = defaultQuotePricingContext()
): string {
  const text = encodeURIComponent(buildConciergeWhatsAppMessage(session, ctx));
  return `https://wa.me/${siteConfig.contact.whatsapp}?text=${text}`;
}
