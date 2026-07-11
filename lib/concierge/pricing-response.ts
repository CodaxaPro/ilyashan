import type { QuoteFormData, QuoteServiceId } from "@/lib/quote-form";
import { getFloorLabel, initialQuoteFormData } from "@/lib/quote-form";
import { calculatePriceEstimate, formatEuro, formatEuroExact } from "@/lib/pricing";
import { siteConfig } from "@/lib/config";
import {
  defaultQuotePricingContext,
  type QuotePricingContext,
} from "@/lib/quote-pricing-context";
import { buildTrustFooter } from "./knowledge";

export function quoteDataForEstimate(partial: Partial<QuoteFormData>): QuoteFormData | null {
  const services: QuoteServiceId[] = partial.services?.length
    ? (partial.services as QuoteServiceId[])
    : ["privat"];
  const windowCount = partial.windowCount ?? 0;
  const floorLevel = partial.floorLevel;

  if (!windowCount || windowCount < 1) return null;
  if (!floorLevel) return null;
  if (!services.includes("privat") && !services.includes("gewerbe") && !services.includes("wartung")) {
    return null;
  }

  return {
    ...initialQuoteFormData,
    ...partial,
    services,
    objectType: partial.objectType || (services.includes("gewerbe") ? "gewerbe" : "wohnung"),
    elevator: partial.elevator || "unbekannt",
    windowCount,
    floorLevel,
    dirtLevel: partial.dirtLevel ?? "normal",
    cleaningSide: partial.cleaningSide ?? "innen_aussen",
  };
}

export function buildPriceResponse(
  partial: Partial<QuoteFormData>,
  ctx: QuotePricingContext = defaultQuotePricingContext()
): string | null {
  const data = quoteDataForEstimate(partial);
  if (!data) return null;

  const estimate = calculatePriceEstimate(data, ctx.pricingOverrides, ctx.wartungConfig);
  if (!estimate) return null;

  const floor = getFloorLabel(data);
  const breakdown =
    estimate.breakdown.length > 0
      ? estimate.breakdown
          .slice(0, 6)
          .map((line) => {
            const sign = line.amount < 0 ? "−" : "+";
            return `  ${line.label}: ${sign}${formatEuroExact(Math.abs(line.amount))}`;
          })
          .join("\n")
      : "";

  let text = `Ihre **Live-Preisschätzung** (${siteConfig.messaging.priceEstimateLabel}):

**ca. ${formatEuro(estimate.amount)}**
Spanne: ${formatEuro(estimate.min)} – ${formatEuro(estimate.max)}

**Ihre Angaben:**
• ${data.windowCount} Fensterflügel
• ${floor}
• ${data.cleaningSide === "innen_aussen" ? "Innen & Außen" : data.cleaningSide === "nur_aussen" ? "Nur außen" : "Nur innen"}`;

  if (breakdown) {
    text += `\n\n**Kalkulation (Auszug):**\n${breakdown}`;
  }

  if (estimate.minimumApplied) {
    text += `\n\n_Mindestauftrag ${formatEuro(estimate.minimumAmount)} greift (berechnet: ${formatEuroExact(estimate.calculatedSubtotal)})._`;
  }

  text += `\n\n_${estimate.note}_`;
  text += `\n\nNach dem Absenden erhalten Sie innerhalb von **${siteConfig.business.responseTime}** Ihr **verbindliches Festpreis-Angebot** per E-Mail.`;
  text += buildTrustFooter();

  return text;
}

export function missingPriceFields(partial: Partial<QuoteFormData>): ("fluegel" | "floor")[] {
  const missing: ("fluegel" | "floor")[] = [];
  if (!partial.windowCount || partial.windowCount < 1) missing.push("fluegel");
  if (!partial.floorLevel) missing.push("floor");
  return missing;
}

export function askForMissingFields(missing: ("fluegel" | "floor")[]): string {
  if (missing.includes("fluegel") && missing.includes("floor")) {
    return `Gerne berechne ich Ihre **Live-Preisschätzung** – dafür brauche ich zwei Angaben:

1. **Wie viele Fensterflügel** haben Sie? (Ein Flügel = ein öffnbares Fensterteil)
2. **Welche Etage?** (z. B. EG, 1. OG, 2. OG)

Beispiel: *„10 Flügel, 2. Stock in Baesweiler"*`;
  }
  if (missing.includes("fluegel")) {
    return `Fast geschafft! **Wie viele Fensterflügel** sollen gereinigt werden?

_Tipp: Ein zweiflügeliges Fenster = 2 Flügel. Bei Unsicherheit helfe ich mit der Flügel-Erklärung – fragen Sie einfach „Wie zähle ich Flügel?"_`;
  }
  return `Danke! In **welcher Etage** befinden sich die Fenster?

Z. B. Erdgeschoss (EG), 1. OG, 2. OG, 3. OG oder Dachgeschoss – das fließt transparent in die Kalkulation ein.`;
}
