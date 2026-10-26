/**
 * P2 — mandatory photo intake policy for Festpreis / high-risk jobs.
 * Fail-closed: when required, 0 photos → block submit.
 */
import type { AssistantProduct } from "@/lib/concierge/types";
import type { ConciergeSession } from "@/lib/concierge/types";
import type { DirtLevel, QuoteFormData } from "@/lib/quote-form";

export const PHOTO_INTAKE_MIN = 1;

/** Products where photos are required before lead close. */
export const PHOTO_REQUIRED_PRODUCTS: ReadonlySet<AssistantProduct> = new Set([
  "bauend",
  "renovierung",
  "entruempelung",
  "praxis",
]);

/** Fenster dirt levels that require photos for accurate Festpreis. */
export const PHOTO_REQUIRED_DIRT: ReadonlySet<DirtLevel> = new Set(["stark", "extrem"]);

export type PhotoIntakeReason =
  | "product"
  | "dirt"
  | "optional";

export function photoRequiredForProduct(product: AssistantProduct | null | undefined): boolean {
  if (!product) return false;
  return PHOTO_REQUIRED_PRODUCTS.has(product);
}

export function photoRequiredForQuote(quote: Partial<QuoteFormData> | undefined): boolean {
  if (!quote?.dirtLevel) return false;
  return PHOTO_REQUIRED_DIRT.has(quote.dirtLevel);
}

export function resolvePhotoIntakeRequirement(input: {
  session?: ConciergeSession | null;
  quote?: Partial<QuoteFormData> | null;
}): { required: boolean; reason: PhotoIntakeReason; messageDe: string } {
  const product = input.session?.assistantProduct ?? null;
  if (photoRequiredForProduct(product)) {
    return {
      required: true,
      reason: "product",
      messageDe:
        "Für ein präzises Festpreis-Angebot brauchen wir mindestens 1 Foto vom Objekt (Zustand, Räume, Verschmutzung). Bitte fügen Sie Fotos hinzu.",
    };
  }
  if (photoRequiredForQuote(input.quote ?? input.session?.quote)) {
    return {
      required: true,
      reason: "dirt",
      messageDe:
        "Bei starker/extremer Verschmutzung brauchen wir mindestens 1 Foto — sonst können wir den Festpreis nicht verlässlich kalkulieren.",
    };
  }
  return {
    required: false,
    reason: "optional",
    messageDe:
      "Fotos helfen bei der Einschätzung (optional). Bis zu 3 Fotos · JPG/PNG/WebP · max. 2 MB.",
  };
}

export function enforcePhotoIntake(input: {
  photoCount: number;
  session?: ConciergeSession | null;
  quote?: Partial<QuoteFormData> | null;
}): { ok: true } | { ok: false; messageDe: string; code: "photos_required" } {
  const policy = resolvePhotoIntakeRequirement(input);
  if (policy.required && input.photoCount < PHOTO_INTAKE_MIN) {
    return { ok: false, code: "photos_required", messageDe: policy.messageDe };
  }
  return { ok: true };
}

/** German copy for assistant tool / lead form. */
export function buildPhotoIntakePrompt(product?: AssistantProduct | null): string {
  if (photoRequiredForProduct(product)) {
    return `Bitte laden Sie jetzt **mindestens 1 Foto** vom Objekt hoch (Zustand sichtbar). Ohne Foto können wir kein verlässliches Festpreis-Angebot erstellen.`;
  }
  return `Fotos vom Objekt helfen uns bei der Einschätzung — optional, aber empfohlen.`;
}
