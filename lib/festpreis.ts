import { formatEuro } from "@/lib/pricing";
import type { StoredLead } from "@/lib/leads-store";
import type { QuoteFormData } from "@/lib/quote-form";
import {
  formatFestpreisDisplay,
  formatFestpreisEmailLine as formatVatFestpreisEmailLine,
  resolvePriceAudience,
  type PriceAudience,
} from "@/lib/vat-display";

/** Default Festpreis = calculator mid-point (BRUTTO / Endpreis). */
export function getDefaultFestpreis(lead: Pick<StoredLead, "festpreis" | "priceSnapshot">): number | undefined {
  if (typeof lead.festpreis === "number" && Number.isFinite(lead.festpreis) && lead.festpreis > 0) {
    return Math.round(lead.festpreis);
  }
  const amount = lead.priceSnapshot?.amount;
  if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
    return Math.round(amount);
  }
  return undefined;
}

export function parseFestpreisInput(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

export function getLeadPriceAudience(
  lead: Pick<StoredLead, "quote"> | null | undefined
): PriceAudience {
  return resolvePriceAudience(lead?.quote as Partial<QuoteFormData> | undefined);
}

/** Short label – brutto with VAT wording. */
export function formatFestpreisLabel(amount: number, audience: PriceAudience = "privat"): string {
  return formatFestpreisDisplay(amount, audience);
}

export function formatFestpreisEmailLine(amount: number, audience: PriceAudience = "privat"): string {
  return formatVatFestpreisEmailLine(amount, audience);
}

/** @deprecated use formatFestpreisLabel with audience */
export function formatFestpreisPlain(amount: number): string {
  return formatEuro(amount);
}
