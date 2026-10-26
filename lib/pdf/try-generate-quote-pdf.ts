import type { QuoteFormData } from "@/lib/quote-form";
import type { QuotePricingContext } from "@/lib/quote-pricing-context";
import { generateQuotePdfBuffer, pdfBufferToBase64 } from "@/lib/pdf/generate-quote-pdf";

export type QuotePdfAttachment = {
  filename: string;
  content: string;
};

/**
 * PDF is best-effort on serverless (pdfkit fonts often missing).
 * Never throw — lead capture must continue without attachment.
 */
export async function tryGenerateQuotePdfAttachment(
  data: QuoteFormData,
  anfrageNr: string,
  ctx: QuotePricingContext
): Promise<QuotePdfAttachment | null> {
  try {
    const pdfBuffer = await generateQuotePdfBuffer(data, anfrageNr, ctx);
    return {
      filename: `Eingangsbestätigung-${anfrageNr}.pdf`,
      content: pdfBufferToBase64(pdfBuffer),
    };
  } catch (error) {
    console.error("Quote PDF generation failed (continuing without PDF):", error);
    return null;
  }
}
