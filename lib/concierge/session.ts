import type { QuoteFormData } from "@/lib/quote-form";
import type { ConciergeSession, ConciergeStage } from "./types";
import {
  extractWindowCount,
  extractFloorLevel,
  extractPostalCode,
  extractService,
  extractCleaningSide,
  extractDirtLevel,
  extractCityHint,
} from "./extract";

export function applyExtractedToQuote(
  quote: Partial<QuoteFormData>,
  message: string
): Partial<QuoteFormData> {
  const next = { ...quote };

  const fluegel = extractWindowCount(message);
  if (fluegel) next.windowCount = fluegel;

  const floor = extractFloorLevel(message);
  if (floor) next.floorLevel = floor;

  const plz = extractPostalCode(message);
  if (plz) next.postalCode = plz;

  const service = extractService(message);
  if (service) next.services = [service];

  const side = extractCleaningSide(message);
  if (side) next.cleaningSide = side;

  const dirt = extractDirtLevel(message);
  if (dirt) next.dirtLevel = dirt;

  const city = extractCityHint(message);
  if (city && !next.city) {
    next.city = city.charAt(0).toUpperCase() + city.slice(1);
  }

  return next;
}

export function mergeQuoteFromMessage(
  session: ConciergeSession,
  message: string
): ConciergeSession {
  return {
    ...session,
    quote: applyExtractedToQuote(session.quote, message),
  };
}

export function resolveStage(missing: ("fluegel" | "floor")[]): ConciergeStage {
  if (missing.includes("fluegel")) return "price_need_fluegel";
  if (missing.includes("floor")) return "price_need_floor";
  return "price_ready";
}
