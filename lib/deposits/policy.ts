/**
 * P2 — Anzahlung / deposit policy for high-ticket jobs.
 * Amounts are policy defaults; admin may override when requesting.
 */
import type { AssistantProduct } from "@/lib/concierge/types";
import type { ConciergeSession } from "@/lib/concierge/types";
import type { StoredLead } from "@/lib/leads-store";

export type DepositStatus = "none" | "requested" | "paid" | "waived";

export interface LeadDeposit {
  status: Exclude<DepositStatus, "none">;
  amountEur: number;
  currency: "EUR";
  reference: string;
  requestedAt: string;
  paidAt?: string;
  waivedAt?: string;
  note?: string;
}

/** Products that typically require Anzahlung before binding slot. */
export const DEPOSIT_REQUIRED_PRODUCTS: ReadonlySet<AssistantProduct> = new Set([
  "bauend",
  "renovierung",
  "entruempelung",
]);

/** Default fraction of Festpreis (or fixed floor). */
export const DEFAULT_DEPOSIT_FRACTION = 0.3;
export const DEFAULT_DEPOSIT_FLOOR_EUR = 80;
export const DEFAULT_DEPOSIT_CAP_EUR = 500;

export function depositRecommendedForProduct(
  product: AssistantProduct | null | undefined
): boolean {
  if (!product) return false;
  return DEPOSIT_REQUIRED_PRODUCTS.has(product);
}

export function depositRecommendedForLead(lead: Pick<StoredLead, "session" | "festpreis" | "serviceLine">): boolean {
  const product = lead.session?.assistantProduct;
  if (depositRecommendedForProduct(product)) return true;
  if (typeof lead.festpreis === "number" && lead.festpreis >= 400) return true;
  const m2 = lead.session?.bueroDraft?.totalAreaM2;
  if (typeof m2 === "number" && m2 >= 200) return true;
  return false;
}

export function suggestDepositAmountEur(festpreis?: number | null): number {
  if (typeof festpreis === "number" && festpreis > 0) {
    const raw = Math.round(festpreis * DEFAULT_DEPOSIT_FRACTION);
    return Math.min(DEFAULT_DEPOSIT_CAP_EUR, Math.max(DEFAULT_DEPOSIT_FLOOR_EUR, raw));
  }
  return DEFAULT_DEPOSIT_FLOOR_EUR;
}

export function buildDepositReference(leadId: string): string {
  const short = leadId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "ILY";
  return `ANZ-${short}`;
}

export function depositBankCopy(): {
  recipient: string;
  ibanHint: string;
  noteDe: string;
} {
  const iban = process.env.DEPOSIT_IBAN?.trim();
  return {
    recipient: process.env.DEPOSIT_RECIPIENT?.trim() || "Ilyashan Fensterreinigung",
    ibanHint: iban
      ? iban
      : "IBAN folgt in der Bestätigungsmail / telefonisch (noch nicht in ENV hinterlegt)",
    noteDe: "Bitte Verwendungszweck exakt angeben, damit wir die Zahlung zuordnen.",
  };
}

export function sessionSuggestsDeposit(session: ConciergeSession | undefined): boolean {
  if (!session) return false;
  if (depositRecommendedForProduct(session.assistantProduct)) return true;
  const m2 = session.bueroDraft?.totalAreaM2;
  return typeof m2 === "number" && m2 >= 200;
}
