import {
  createInitialCustomerInput,
  type AdditionalServices,
  type CleaningCondition,
  type CleaningFrequency,
  type CustomerInput,
  type FloorAreas,
  type KitchenCounts,
  type OfficeCounts,
  type SanitaryCounts,
  type SubAreas,
  type UsageIntensity,
} from "./types";
import { redistributeFloors, redistributeSubAreas } from "./area-sync";

const USAGE: UsageIntensity[] = ["LOW", "NORMAL", "HIGH"];
const CONDITION: CleaningCondition[] = [
  "MAINTAINED",
  "NORMAL",
  "NEGLECTED",
  "INITIAL_INTENSIVE",
];
const FREQUENCY: CleaningFrequency[] = [
  "ONE_TIME",
  "1_PER_WEEK",
  "2_PER_WEEK",
  "3_PER_WEEK",
  "5_PER_WEEK",
  "CUSTOM",
];

const MAX_AREA = 50_000;
const MAX_COUNT = 5_000;

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function pickEnum<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as T)
    : fallback;
}

function readSubAreas(raw: unknown, total: number): SubAreas {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const draft: SubAreas = {
    office: clamp(num(o.office), 0, MAX_AREA),
    meeting: clamp(num(o.meeting), 0, MAX_AREA),
    kitchen: clamp(num(o.kitchen), 0, MAX_AREA),
    sanitary: clamp(num(o.sanitary), 0, MAX_AREA),
    corridors: clamp(num(o.corridors), 0, MAX_AREA),
    reception: clamp(num(o.reception), 0, MAX_AREA),
    other: clamp(num(o.other), 0, MAX_AREA),
  };
  const sum =
    draft.office +
    draft.meeting +
    draft.kitchen +
    draft.sanitary +
    draft.corridors +
    draft.reception +
    draft.other;
  if (sum <= 0 && total > 0) {
    return redistributeSubAreas(total, draft);
  }
  return draft;
}

function readFloors(raw: unknown, total: number): FloorAreas {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const draft: FloorAreas = {
    carpet: clamp(num(o.carpet), 0, MAX_AREA),
    hard: clamp(num(o.hard), 0, MAX_AREA),
    wet: clamp(num(o.wet), 0, MAX_AREA),
    other: clamp(num(o.other), 0, MAX_AREA),
  };
  const sum = draft.carpet + draft.hard + draft.wet + draft.other;
  if (sum <= 0 && total > 0) {
    return redistributeFloors(total, draft);
  }
  return draft;
}

/**
 * Normalize untrusted browser payload into CustomerInput.
 * Rejects NaN/Infinity via clamp; never trusts client prices.
 */
export function normalizeCustomerInput(raw: unknown): CustomerInput {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const base = createInitialCustomerInput();
  const totalAreaM2 = clamp(num(body.totalAreaM2), 0, MAX_AREA);

  const officeRaw = (body.office && typeof body.office === "object"
    ? body.office
    : {}) as Record<string, unknown>;
  const sanitaryRaw = (body.sanitary && typeof body.sanitary === "object"
    ? body.sanitary
    : {}) as Record<string, unknown>;
  const kitchenRaw = (body.kitchen && typeof body.kitchen === "object"
    ? body.kitchen
    : {}) as Record<string, unknown>;
  const additionalRaw = (body.additional && typeof body.additional === "object"
    ? body.additional
    : {}) as Record<string, unknown>;

  const office: OfficeCounts = {
    workstations: clamp(num(officeRaw.workstations), 0, MAX_COUNT),
    officeBins: clamp(num(officeRaw.officeBins), 0, MAX_COUNT),
    officeBinsAutoSuggested: bool(officeRaw.officeBinsAutoSuggested, true),
    meetingRooms: clamp(num(officeRaw.meetingRooms), 0, MAX_COUNT),
    meetingChairs: clamp(num(officeRaw.meetingChairs), 0, MAX_COUNT),
    cabinetExterior: bool(officeRaw.cabinetExterior),
    shelving: bool(officeRaw.shelving),
    windowSills: bool(officeRaw.windowSills),
    phoneMonitorExterior: bool(officeRaw.phoneMonitorExterior),
    whiteboards: bool(officeRaw.whiteboards),
  };

  const sanitary: SanitaryCounts = {
    toilets: clamp(num(sanitaryRaw.toilets), 0, MAX_COUNT),
    urinals: clamp(num(sanitaryRaw.urinals), 0, MAX_COUNT),
    washbasins: clamp(num(sanitaryRaw.washbasins), 0, MAX_COUNT),
    mirrors: clamp(num(sanitaryRaw.mirrors), 0, MAX_COUNT),
    sanitaryBins: clamp(num(sanitaryRaw.sanitaryBins), 0, MAX_COUNT),
    showers: clamp(num(sanitaryRaw.showers), 0, MAX_COUNT),
    cubicles: clamp(num(sanitaryRaw.cubicles), 0, MAX_COUNT),
  };

  const kitchen: KitchenCounts = {
    kitchens: clamp(num(kitchenRaw.kitchens), 0, 200),
    tables: clamp(num(kitchenRaw.tables), 0, MAX_COUNT),
    chairs: clamp(num(kitchenRaw.chairs), 0, MAX_COUNT),
    sinks: clamp(num(kitchenRaw.sinks), 0, MAX_COUNT),
    countertopUnits: clamp(num(kitchenRaw.countertopUnits), 0, MAX_COUNT),
    bins: clamp(num(kitchenRaw.bins), 0, MAX_COUNT),
    applianceExteriors: clamp(num(kitchenRaw.applianceExteriors), 0, MAX_COUNT),
    microwaveInside: bool(kitchenRaw.microwaveInside),
    refrigeratorInside: bool(kitchenRaw.refrigeratorInside),
    dishwasher: bool(kitchenRaw.dishwasher),
    cabinetFronts: bool(kitchenRaw.cabinetFronts),
    dishes: bool(kitchenRaw.dishes),
  };

  const additional: AdditionalServices = {
    stairFloors: clamp(num(additionalRaw.stairFloors), 0, 200),
    elevator: bool(additionalRaw.elevator),
    glassEntranceDoors: clamp(num(additionalRaw.glassEntranceDoors), 0, 100),
    receptionDetail: bool(additionalRaw.receptionDetail),
    highTouchAreas: bool(additionalRaw.highTouchAreas),
  };

  const language = body.language === "tr" ? "tr" : "de";

  return {
    ...base,
    totalAreaM2,
    usageIntensity: pickEnum(body.usageIntensity, USAGE, "NORMAL"),
    condition: pickEnum(body.condition, CONDITION, "NORMAL"),
    frequency: pickEnum(body.frequency, FREQUENCY, "2_PER_WEEK"),
    customFrequencyPerWeek:
      body.customFrequencyPerWeek !== undefined
        ? clamp(num(body.customFrequencyPerWeek), 0, 14)
        : undefined,
    subAreas: readSubAreas(body.subAreas, totalAreaM2),
    floors: readFloors(body.floors, totalAreaM2),
    office,
    sanitary,
    kitchen,
    additional,
    postalCode:
      typeof body.postalCode === "string" ? body.postalCode.trim().slice(0, 12) : undefined,
    city: typeof body.city === "string" ? body.city.trim().slice(0, 80) : undefined,
    language,
  };
}

export interface CleaningContactInput {
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  notes?: string;
  desiredStartDate?: string;
  preferredCleaningTime?: string;
  /** Art. 13 notice acknowledged — not marketing consent */
  privacyNoticeAccepted: boolean;
}

export function normalizeContactInput(raw: unknown): CleaningContactInput | null {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const contactPerson =
    typeof body.contactPerson === "string" ? body.contactPerson.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const street = typeof body.street === "string" ? body.street.trim() : "";
  const postalCode = typeof body.postalCode === "string" ? body.postalCode.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const privacyNoticeAccepted = body.privacyNoticeAccepted === true;

  if (!company || !contactPerson || !email || !phone || !postalCode || !city) {
    return null;
  }
  if (!privacyNoticeAccepted) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return {
    company: company.slice(0, 120),
    contactPerson: contactPerson.slice(0, 120),
    email: email.slice(0, 160),
    phone: phone.slice(0, 40),
    street: street.slice(0, 160),
    postalCode: postalCode.slice(0, 12),
    city: city.slice(0, 80),
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : undefined,
    desiredStartDate:
      typeof body.desiredStartDate === "string"
        ? body.desiredStartDate.trim().slice(0, 32)
        : undefined,
    preferredCleaningTime:
      typeof body.preferredCleaningTime === "string"
        ? body.preferredCleaningTime.trim().slice(0, 40)
        : undefined,
    privacyNoticeAccepted,
  };
}

/** Reject if client tries to inject admin/pricing fields into input blob. */
export function detectPriceInjection(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const keys = Object.keys(raw as object);
  const forbidden = [
    "netCents",
    "grossCents",
    "laborCost",
    "margin",
    "festpreis",
    "overridePrice",
    "productiveHourCost",
    "admin",
    "totalCostCents",
    "roundedNetCents",
  ];
  return forbidden.filter((k) => keys.includes(k));
}
