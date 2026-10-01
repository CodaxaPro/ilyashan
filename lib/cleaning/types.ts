/** Canonical customer input + quote enums for Büroreinigung. */

export type UsageIntensity = "LOW" | "NORMAL" | "HIGH";

export type CleaningCondition =
  | "MAINTAINED"
  | "NORMAL"
  | "NEGLECTED"
  | "INITIAL_INTENSIVE";

export type CleaningFrequency =
  | "ONE_TIME"
  | "1_PER_WEEK"
  | "2_PER_WEEK"
  | "3_PER_WEEK"
  | "5_PER_WEEK"
  | "CUSTOM";

export type QuoteStatus = "INDICATION" | "FIXED_PRICE" | "MANUAL_REVIEW_REQUIRED";

export type ValidationLevel = "INFO" | "WARNING" | "BLOCKING_ERROR";

export type RateType = "MINUTES_PER_UNIT" | "UNITS_PER_HOUR";

export type MeasurementType =
  | "AREA_M2"
  | "COUNT"
  | "LINEAR_METER"
  | "ROOM"
  | "FIXTURE";

export type SourceType =
  | "INTERNAL_TIME_STUDY"
  | "LICENSED_STANDARD"
  | "PUBLIC_BENCHMARK"
  | "ADMIN_ESTIMATE"
  | "LEGAL_REQUIREMENT";

export type RateStatus = "CALIBRATION_REQUIRED" | "APPROVED" | "DEPRECATED";

export type OverheadModel = "HOURLY_ALLOCATION" | "PERCENTAGE_OF_DIRECT_COST";

export type RoundingMode = "NONE" | "0.50" | "1.00" | "5.00" | "COMMERCIAL_90";

export interface SubAreas {
  office: number;
  meeting: number;
  kitchen: number;
  sanitary: number;
  corridors: number;
  reception: number;
  other: number;
}

export interface FloorAreas {
  carpet: number;
  hard: number;
  wet: number;
  other: number;
}

export interface OfficeCounts {
  workstations: number;
  officeBins: number;
  /** true = bins auto-suggested; false = user overrode */
  officeBinsAutoSuggested: boolean;
  meetingRooms: number;
  meetingChairs: number;
  cabinetExterior: boolean;
  shelving: boolean;
  windowSills: boolean;
  phoneMonitorExterior: boolean;
  whiteboards: boolean;
}

export interface SanitaryCounts {
  toilets: number;
  urinals: number;
  washbasins: number;
  mirrors: number;
  sanitaryBins: number;
  showers: number;
  cubicles: number;
}

export interface KitchenCounts {
  kitchens: number;
  tables: number;
  chairs: number;
  sinks: number;
  countertopUnits: number;
  bins: number;
  applianceExteriors: number;
  microwaveInside: boolean;
  refrigeratorInside: boolean;
  dishwasher: boolean;
  cabinetFronts: boolean;
  dishes: boolean;
}

export interface AdditionalServices {
  stairFloors: number;
  elevator: boolean;
  glassEntranceDoors: number;
  receptionDetail: boolean;
  highTouchAreas: boolean;
}

export interface CustomerInput {
  totalAreaM2: number;
  usageIntensity: UsageIntensity;
  condition: CleaningCondition;
  frequency: CleaningFrequency;
  customFrequencyPerWeek?: number;
  subAreas: SubAreas;
  /** Internal locks for future UI — unlocked redistribute */
  subAreaLocks: Partial<Record<keyof SubAreas, boolean>>;
  floors: FloorAreas;
  floorLocks: Partial<Record<keyof FloorAreas, boolean>>;
  office: OfficeCounts;
  sanitary: SanitaryCounts;
  kitchen: KitchenCounts;
  additional: AdditionalServices;
  postalCode?: string;
  city?: string;
  language: "de" | "tr";
}

export function emptySubAreas(): SubAreas {
  return {
    office: 0,
    meeting: 0,
    kitchen: 0,
    sanitary: 0,
    corridors: 0,
    reception: 0,
    other: 0,
  };
}

export function emptyFloors(): FloorAreas {
  return { carpet: 0, hard: 0, wet: 0, other: 0 };
}

export function sumSubAreas(s: SubAreas): number {
  return (
    s.office +
    s.meeting +
    s.kitchen +
    s.sanitary +
    s.corridors +
    s.reception +
    s.other
  );
}

export function sumFloors(f: FloorAreas): number {
  return f.carpet + f.hard + f.wet + f.other;
}

export function createInitialCustomerInput(
  overrides: Partial<CustomerInput> = {}
): CustomerInput {
  return {
    totalAreaM2: 0,
    usageIntensity: "NORMAL",
    condition: "NORMAL",
    frequency: "2_PER_WEEK",
    subAreas: emptySubAreas(),
    subAreaLocks: {},
    floors: emptyFloors(),
    floorLocks: {},
    office: {
      workstations: 0,
      officeBins: 0,
      officeBinsAutoSuggested: true,
      meetingRooms: 0,
      meetingChairs: 0,
      cabinetExterior: false,
      shelving: false,
      windowSills: false,
      phoneMonitorExterior: false,
      whiteboards: false,
    },
    sanitary: {
      toilets: 0,
      urinals: 0,
      washbasins: 0,
      mirrors: 0,
      sanitaryBins: 0,
      showers: 0,
      cubicles: 0,
    },
    kitchen: {
      kitchens: 0,
      tables: 0,
      chairs: 0,
      sinks: 0,
      countertopUnits: 0,
      bins: 0,
      applianceExteriors: 0,
      microwaveInside: false,
      refrigeratorInside: false,
      dishwasher: false,
      cabinetFronts: false,
      dishes: false,
    },
    additional: {
      stairFloors: 0,
      elevator: false,
      glassEntranceDoors: 0,
      receptionDetail: false,
      highTouchAreas: false,
    },
    language: "de",
    ...overrides,
  };
}
