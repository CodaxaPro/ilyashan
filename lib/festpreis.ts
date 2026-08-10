import { formatEuro } from "@/lib/pricing";
import type { StoredLead } from "@/lib/leads-store";

/** Default Festpreis = calculator mid-point from the captured Live-Schätzung. */
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

export function formatFestpreisLabel(amount: number): string {
  return formatEuro(amount);
}

export function formatFestpreisEmailLine(amount: number): string {
  return `Ihr Festpreis: ${formatEuro(amount)} (verbindlich)`;
}
