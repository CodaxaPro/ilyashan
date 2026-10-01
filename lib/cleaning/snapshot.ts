import type { CustomerInput, QuoteStatus } from "./types";
import type { QuoteCalculation } from "./calculate";
import type { CleaningContactInput } from "./normalize-input";
import type { CleaningEngineConfig } from "./seed-config";

/** Immutable calculation snapshot — config changes must not mutate historical quotes. */
export interface CleaningQuoteSnapshot {
  schemaVersion: 1;
  quoteReference: string;
  capturedAt: string;
  language: "de" | "tr";
  quoteStatus: QuoteStatus;
  configVersionId: string;
  input: CustomerInput;
  contact: CleaningContactInput;
  /** Customer-visible commercial result */
  customer: QuoteCalculation["customer"];
  /** Full internal explainability — admin only, never returned on public calculate */
  admin: QuoteCalculation["admin"];
  /** If browser sent a preview net, log delta (server wins) */
  clientPreviewNetCents?: number;
  discrepancyCents?: number;
}

export function buildCleaningQuoteSnapshot(args: {
  quoteReference: string;
  input: CustomerInput;
  contact: CleaningContactInput;
  calc: QuoteCalculation;
  config: CleaningEngineConfig;
  clientPreviewNetCents?: number;
}): CleaningQuoteSnapshot {
  const discrepancyCents =
    typeof args.clientPreviewNetCents === "number" && Number.isFinite(args.clientPreviewNetCents)
      ? Math.round(args.calc.customer.netCents - args.clientPreviewNetCents)
      : undefined;

  return {
    schemaVersion: 1,
    quoteReference: args.quoteReference,
    capturedAt: new Date().toISOString(),
    language: args.input.language,
    quoteStatus: args.calc.customer.quoteStatus,
    configVersionId: args.config.configVersionId,
    input: structuredClone(args.input),
    contact: structuredClone(args.contact),
    customer: structuredClone(args.calc.customer),
    admin: structuredClone(args.calc.admin),
    clientPreviewNetCents: args.clientPreviewNetCents,
    discrepancyCents,
  };
}

export function generateCleaningQuoteReference(now = new Date()): string {
  const year = now.getFullYear();
  const seq = String(now.getTime()).slice(-6);
  return `ANG-${year}-${seq}`;
}
