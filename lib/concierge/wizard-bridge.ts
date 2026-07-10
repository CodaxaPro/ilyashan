import type { QuoteFormData } from "@/lib/quote-form";
import { initialQuoteFormData } from "@/lib/quote-form";
import {
  canProceedQuoteStep,
  normalizeServices,
  syncObjectTypeWithService,
} from "@/lib/quote-validation";
import type { ConciergeSession } from "./types";

export const WIZARD_PREFILL_KEY = "ilyashan-wizard-prefill";
export const WIZARD_PREFILL_SOURCE_KEY = "ilyashan-wizard-prefill-source";

export function hasTransferableQuoteData(session: ConciergeSession): boolean {
  const q = session.quote;
  if (q.windowCount && q.windowCount >= 1) return true;
  if (q.floorLevel) return true;
  if (q.postalCode?.trim()) return true;
  if (q.city?.trim()) return true;
  if (q.objectType) return true;
  if (q.elevator && q.elevator !== "unbekannt") return true;
  if (q.cleaningSide && q.cleaningSide !== "innen_aussen") return true;
  if (q.dirtLevel && q.dirtLevel !== "normal") return true;
  if (session.stage === "price_ready" || session.stage.startsWith("price_need")) return true;
  return false;
}

export function conciergeQuoteToWizardPrefill(session: ConciergeSession): Partial<QuoteFormData> {
  if (!hasTransferableQuoteData(session)) return {};

  const q = session.quote;
  const services = normalizeServices(q.services?.length ? q.services : ["privat"]);
  const defaultObjectType = services.includes("gewerbe") ? "gewerbe" : "wohnung";
  const objectType = syncObjectTypeWithService(services, q.objectType || defaultObjectType);

  const prefill: Partial<QuoteFormData> = {
    services,
    objectType,
  };

  if (q.objectTypeOther) prefill.objectTypeOther = q.objectTypeOther;
  if (q.floorLevel) prefill.floorLevel = q.floorLevel;
  prefill.elevator = q.elevator || "unbekannt";
  if (q.windowCount && q.windowCount >= 1) prefill.windowCount = q.windowCount;
  if (q.roomHeight) prefill.roomHeight = q.roomHeight;
  if (q.dirtLevel) prefill.dirtLevel = q.dirtLevel;
  if (q.cleaningSide) prefill.cleaningSide = q.cleaningSide;
  if (q.postalCode) prefill.postalCode = q.postalCode;
  if (q.city) prefill.city = q.city;
  if (q.narrowStairs) prefill.narrowStairs = q.narrowStairs;
  if (q.accessTimes) {
    prefill.accessTimes = q.accessTimes;
    if (q.accessTimesNote) prefill.accessTimesNote = q.accessTimesNote;
  }
  if (q.specialFeatures) {
    prefill.specialFeatures = q.specialFeatures;
    if (q.specialNotes) prefill.specialNotes = q.specialNotes;
  }
  if (q.includeSolar) {
    prefill.includeSolar = true;
    if (q.solarSqm) prefill.solarSqm = q.solarSqm;
  }
  if (q.includeWintergarden) {
    prefill.includeWintergarden = true;
    if (q.wintergardenSqm) prefill.wintergardenSqm = q.wintergardenSqm;
  }
  if (q.withFrame) prefill.withFrame = true;
  if (q.withFalz) prefill.withFalz = true;
  if (q.windowSills) prefill.windowSills = true;
  if (q.muntinWindows) prefill.muntinWindows = true;
  if (q.oldBuildingWindows) prefill.oldBuildingWindows = true;
  if (q.skylights) prefill.skylights = true;
  if (q.shutters) prefill.shutters = true;
  if (q.blinds) prefill.blinds = true;
  if (q.canopy) {
    prefill.canopy = true;
    if (q.canopySqm) prefill.canopySqm = q.canopySqm;
  }
  if (q.flyScreens) prefill.flyScreens = true;
  if (q.additionalInfo) prefill.additionalInfo = q.additionalInfo;

  return prefill;
}

export function mergeWizardPrefill(
  base: QuoteFormData,
  prefill: Partial<QuoteFormData>
): QuoteFormData {
  const services = prefill.services ? normalizeServices(prefill.services) : base.services;
  const merged: QuoteFormData = { ...base, ...prefill, services };
  merged.objectType = syncObjectTypeWithService(services, prefill.objectType ?? merged.objectType);
  return merged;
}

export function suggestWizardStepAfterPrefill(data: QuoteFormData): number {
  if (!canProceedQuoteStep(1, data)) return 1;
  if (!canProceedQuoteStep(2, data)) return 2;
  if (!canProceedQuoteStep(3, data)) return 3;
  return 3;
}

export function saveWizardPrefillFromSession(session: ConciergeSession): boolean {
  if (typeof window === "undefined") return false;
  const prefill = conciergeQuoteToWizardPrefill(session);
  if (Object.keys(prefill).length === 0) return false;
  try {
    sessionStorage.setItem(WIZARD_PREFILL_KEY, JSON.stringify(prefill));
    sessionStorage.setItem(WIZARD_PREFILL_SOURCE_KEY, "concierge");
    return true;
  } catch {
    return false;
  }
}

export function loadWizardPrefill(): Partial<QuoteFormData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WIZARD_PREFILL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<QuoteFormData>;
  } catch {
    return null;
  }
}

export function loadWizardPrefillSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(WIZARD_PREFILL_SOURCE_KEY);
  } catch {
    return null;
  }
}

export function clearWizardPrefill(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(WIZARD_PREFILL_KEY);
    sessionStorage.removeItem(WIZARD_PREFILL_SOURCE_KEY);
  } catch {
    /* ignore */
  }
}

export function consumeWizardPrefill(): {
  prefill: Partial<QuoteFormData>;
  source: string | null;
} | null {
  const prefill = loadWizardPrefill();
  if (!prefill || Object.keys(prefill).length === 0) return null;
  const source = loadWizardPrefillSource();
  clearWizardPrefill();
  return { prefill, source };
}

export function applyConciergePrefillToWizard(): {
  data: QuoteFormData;
  step: number;
  fromConcierge: boolean;
} | null {
  const consumed = consumeWizardPrefill();
  if (!consumed) return null;
  const data = mergeWizardPrefill(initialQuoteFormData, consumed.prefill);
  return {
    data,
    step: suggestWizardStepAfterPrefill(data),
    fromConcierge: consumed.source === "concierge",
  };
}
