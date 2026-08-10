import { formatEuro, formatEuroExact } from "@/lib/pricing";
import type { QuoteFormData } from "@/lib/quote-form";

/** German standard VAT for Gebäudereinigung / Fensterreinigung. */
export const VAT_RATE = 0.19;
export const VAT_PERCENT_LABEL = "19 %";

export type PriceAudience = "privat" | "gewerbe";

/**
 * Calculator amounts are always BRUTTO (Endpreis).
 * Privat: show inkl. MwSt.
 * Gewerbe: show Netto + zzgl. MwSt. + Brutto (same total).
 */
export function resolvePriceAudience(
  data: Pick<Partial<QuoteFormData>, "services" | "objectType"> | null | undefined
): PriceAudience {
  if (!data) return "privat";
  if (data.services?.includes("gewerbe") || data.objectType === "gewerbe") return "gewerbe";
  return "privat";
}

export interface VatSplit {
  /** Endpreis / what the customer pays in total — source of truth from calculator. */
  brutto: number;
  netto: number;
  mwst: number;
  rate: number;
}

/**
 * Split a brutto Endpreis into netto + MwSt. without changing the brutto total.
 * netto + mwst === brutto (cent-accurate).
 */
export function splitBrutto(brutto: number): VatSplit {
  const bruttoCents = Math.round(brutto * 100);
  const nettoCents = Math.round(bruttoCents / (1 + VAT_RATE));
  const mwstCents = bruttoCents - nettoCents;
  return {
    brutto: bruttoCents / 100,
    netto: nettoCents / 100,
    mwst: mwstCents / 100,
    rate: VAT_RATE,
  };
}

export function formatEstimateRangeLabel(
  min: number,
  max: number,
  audience: PriceAudience,
  options?: { approximate?: boolean }
): string {
  const approx = options?.approximate !== false ? "ca. " : "";
  if (audience === "gewerbe") {
    const minSplit = splitBrutto(min);
    const maxSplit = splitBrutto(max);
    return (
      `Netto ${approx}${formatEuroExact(minSplit.netto)} – ${formatEuroExact(maxSplit.netto)}` +
      ` zzgl. ${VAT_PERCENT_LABEL} MwSt.` +
      ` · Brutto ${approx}${formatEuro(min)} – ${formatEuro(max)}`
    );
  }
  return `${approx}${formatEuro(min)} – ${formatEuro(max)} inkl. MwSt.`;
}

export function formatEstimateAmountLabel(
  amount: number,
  audience: PriceAudience,
  options?: { approximate?: boolean }
): string {
  const approx = options?.approximate !== false ? "ca. " : "";
  if (audience === "gewerbe") {
    const split = splitBrutto(amount);
    return (
      `Brutto ${approx}${formatEuro(split.brutto)}` +
      ` · Netto ${approx}${formatEuroExact(split.netto)} zzgl. ${VAT_PERCENT_LABEL} MwSt.`
    );
  }
  return `${approx}${formatEuro(amount)} inkl. MwSt.`;
}

export function formatFestpreisDisplay(brutto: number, audience: PriceAudience): string {
  if (audience === "gewerbe") {
    const split = splitBrutto(brutto);
    return (
      `Netto ${formatEuroExact(split.netto)} zzgl. ${VAT_PERCENT_LABEL} MwSt.` +
      ` (${formatEuroExact(split.mwst)}) · Brutto ${formatEuro(split.brutto)}`
    );
  }
  return `${formatEuro(brutto)} inkl. MwSt.`;
}

export function formatFestpreisEmailLine(brutto: number, audience: PriceAudience): string {
  if (audience === "gewerbe") {
    const split = splitBrutto(brutto);
    return (
      `Ihr Festpreis (verbindlich): Netto ${formatEuroExact(split.netto)}` +
      ` zzgl. ${VAT_PERCENT_LABEL} MwSt. (${formatEuroExact(split.mwst)})` +
      ` · Brutto ${formatEuro(split.brutto)}`
    );
  }
  return `Ihr Festpreis: ${formatEuro(brutto)} inkl. MwSt. (verbindlich)`;
}

/** Multi-line text block for emails / admin preview. */
export function formatFestpreisBreakdownLines(brutto: number, audience: PriceAudience): string[] {
  if (audience === "gewerbe") {
    const split = splitBrutto(brutto);
    return [
      "Ihr Festpreis (verbindlich)",
      `Netto: ${formatEuroExact(split.netto)}`,
      `zzgl. ${VAT_PERCENT_LABEL} MwSt.: ${formatEuroExact(split.mwst)}`,
      `Brutto / Endpreis: ${formatEuro(split.brutto)}`,
    ];
  }
  return [`Ihr Festpreis: ${formatEuro(brutto)} inkl. MwSt. (verbindlich)`];
}

export function formatFestpreisHtmlInner(brutto: number, audience: PriceAudience): string {
  if (audience === "gewerbe") {
    const split = splitBrutto(brutto);
    return [
      `<strong>Ihr Festpreis (verbindlich)</strong>`,
      `Netto: <strong>${escapePlain(formatEuroExact(split.netto))}</strong>`,
      `zzgl. ${VAT_PERCENT_LABEL} MwSt.: <strong>${escapePlain(formatEuroExact(split.mwst))}</strong>`,
      `Brutto / Endpreis: <strong>${escapePlain(formatEuro(split.brutto))}</strong>`,
    ].join("<br>");
  }
  return (
    `<strong>Ihr Festpreis:</strong> ${escapePlain(formatEuro(brutto))}` +
    ` inkl. MwSt. · verbindlich`
  );
}

function escapePlain(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function vatFootnote(audience: PriceAudience): string {
  if (audience === "gewerbe") {
    return `Gewerbe: Preise als Netto zzgl. ${VAT_PERCENT_LABEL} MwSt. – Brutto ist der Endpreis.`;
  }
  return "Privat: Alle Preise inkl. MwSt. (Endpreis).";
}
