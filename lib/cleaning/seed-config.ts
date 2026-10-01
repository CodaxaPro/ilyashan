/**
 * Seed configuration — all production rates CALIBRATION_REQUIRED / ADMIN_ESTIMATE
 * unless marked LEGAL_REQUIREMENT. Not official ISSA values.
 */

import type {
  MeasurementType,
  OverheadModel,
  RateStatus,
  RateType,
  RoundingMode,
  SourceType,
} from "./types";
import { eurosToCents, type EuroCents } from "./money";

export interface TaskRateSeed {
  id: string;
  category: string;
  nameDE: string;
  nameTR: string;
  measurementType: MeasurementType;
  unit: string;
  baseRate: number;
  rateType: RateType;
  tool: string;
  active: boolean;
  version: string;
  sourceType: SourceType;
  status: RateStatus;
  sourceReference: string;
  includesTaskIds: string[];
  excludesTaskIds: string[];
  notes: string;
}

export interface CleaningEngineConfig {
  configVersionId: string;
  effectiveFrom: string;
  lg1GrossHourlyEuros: number;
  /** Temporary productive hour cost until payroll model filled — CALIBRATION */
  productiveHourCostCents: EuroCents;
  productivePaidTimeRatio: number;
  targetGrossMargin: number;
  minimumGrossMargin: number;
  minimumBillablePersonHours: number;
  minimumJobNetCents: EuroCents;
  vatRateBps: number;
  vatEffectiveFrom: string;
  overheadModel: OverheadModel;
  overheadPercentOfDirect: number;
  overheadPerHourCents: EuroCents;
  teamEfficiency: Record<1 | 2 | 3 | 4, number>;
  maxTeamSize: number;
  targetOnsiteHours: number;
  rounding: RoundingMode;
  conditionFactors: Record<string, number>;
  usageFactors: Record<string, number>;
  /** Workload efficiency for recurring — NOT commercial discount */
  frequencyWorkloadFactors: Record<string, number>;
  /** Commercial discount on selling price after cost/margin */
  frequencyCommercialDiscounts: Record<string, number>;
  tasks: TaskRateSeed[];
}

/** LG1 Innen-/Unterhaltsreinigung floor 2026-01-01 — verify BMAS before go-live. */
export const LG1_2026_GROSS_HOURLY = 15;

export const DEFAULT_CLEANING_CONFIG: CleaningEngineConfig = {
  configVersionId: "cleaning-config-2026-seed-v1",
  effectiveFrom: "2026-01-01",
  lg1GrossHourlyEuros: LG1_2026_GROSS_HOURLY,
  // Placeholder burdened rate — CALIBRATION_REQUIRED (not wage×1.25 as truth)
  productiveHourCostCents: eurosToCents(28),
  productivePaidTimeRatio: 0.75,
  targetGrossMargin: 0.25,
  minimumGrossMargin: 0.15,
  minimumBillablePersonHours: 2,
  minimumJobNetCents: eurosToCents(80),
  vatRateBps: 1900,
  vatEffectiveFrom: "2026-01-01",
  overheadModel: "PERCENTAGE_OF_DIRECT_COST",
  overheadPercentOfDirect: 0.12,
  overheadPerHourCents: eurosToCents(8),
  teamEfficiency: { 1: 1, 2: 1.85, 3: 2.55, 4: 3.2 },
  maxTeamSize: 4,
  targetOnsiteHours: 3,
  rounding: "0.50",
  conditionFactors: {
    MAINTAINED: 0.9,
    NORMAL: 1,
    NEGLECTED: 1.25,
    INITIAL_INTENSIVE: 1.6,
  },
  usageFactors: {
    LOW: 0.9,
    NORMAL: 1,
    HIGH: 1.2,
  },
  frequencyWorkloadFactors: {
    ONE_TIME: 1.1,
    "1_PER_WEEK": 1,
    "2_PER_WEEK": 0.95,
    "3_PER_WEEK": 0.92,
    "5_PER_WEEK": 0.88,
    CUSTOM: 1,
  },
  frequencyCommercialDiscounts: {
    ONE_TIME: 0,
    "1_PER_WEEK": 0,
    "2_PER_WEEK": 0.03,
    "3_PER_WEEK": 0.05,
    "5_PER_WEEK": 0.08,
    CUSTOM: 0,
  },
  tasks: [
    {
      id: "carpet_vacuum",
      category: "floor",
      nameDE: "Teppich saugen",
      nameTR: "Halı süpürme",
      measurementType: "AREA_M2",
      unit: "m²",
      baseRate: 350,
      rateType: "UNITS_PER_HOUR",
      tool: "vacuum",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "CALIBRATION_REQUIRED — not ISSA",
    },
    {
      id: "hard_floor_damp_mop",
      category: "floor",
      nameDE: "Hartboden feucht wischen",
      nameTR: "Sert zemin nemli silme",
      measurementType: "AREA_M2",
      unit: "m²",
      baseRate: 280,
      rateType: "UNITS_PER_HOUR",
      tool: "mop",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: ["wet_floor_clean"],
      notes: "CALIBRATION_REQUIRED",
    },
    {
      id: "wet_floor_clean",
      category: "floor",
      nameDE: "Nassbereich Bodenreinigung",
      nameTR: "Islak alan zemin temizliği",
      measurementType: "AREA_M2",
      unit: "m²",
      baseRate: 200,
      rateType: "UNITS_PER_HOUR",
      tool: "wet",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "Sanitary fixture bundle must NOT re-add this floor task",
    },
    {
      id: "desk_surfaces",
      category: "office",
      nameDE: "Schreibtischflächen",
      nameTR: "Masa yüzeyleri",
      measurementType: "COUNT",
      unit: "Stk",
      baseRate: 1.5,
      rateType: "MINUTES_PER_UNIT",
      tool: "cloth",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "CALIBRATION_REQUIRED",
    },
    {
      id: "office_bin_empty",
      category: "office",
      nameDE: "Papierkorb leeren",
      nameTR: "Çöp kutusu boşaltma",
      measurementType: "COUNT",
      unit: "Stk",
      baseRate: 0.4,
      rateType: "MINUTES_PER_UNIT",
      tool: "bin",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "CALIBRATION_REQUIRED",
    },
    {
      id: "meeting_chair_wipe",
      category: "office",
      nameDE: "Meetingstuhl abwischen",
      nameTR: "Toplantı sandalyesi silme",
      measurementType: "COUNT",
      unit: "Stk",
      baseRate: 0.35,
      rateType: "MINUTES_PER_UNIT",
      tool: "cloth",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "CALIBRATION_REQUIRED",
    },
    {
      id: "toilet_fixture",
      category: "sanitary",
      nameDE: "WC reinigen/desinfizieren",
      nameTR: "WC temizleme/dezenfeksiyon",
      measurementType: "FIXTURE",
      unit: "Stk",
      baseRate: 4,
      rateType: "MINUTES_PER_UNIT",
      tool: "sanitary",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: ["wet_floor_clean"],
      notes: "Floor cleaning excluded — use wet_floor_clean from floor m²",
    },
    {
      id: "urinal_fixture",
      category: "sanitary",
      nameDE: "Urinal reinigen",
      nameTR: "Pisuvar temizleme",
      measurementType: "FIXTURE",
      unit: "Stk",
      baseRate: 2.5,
      rateType: "MINUTES_PER_UNIT",
      tool: "sanitary",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: ["wet_floor_clean"],
      notes: "CALIBRATION_REQUIRED",
    },
    {
      id: "washbasin_fixture",
      category: "sanitary",
      nameDE: "Waschbecken reinigen",
      nameTR: "Lavabo temizleme",
      measurementType: "FIXTURE",
      unit: "Stk",
      baseRate: 2,
      rateType: "MINUTES_PER_UNIT",
      tool: "sanitary",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: ["wet_floor_clean"],
      notes: "CALIBRATION_REQUIRED",
    },
    {
      id: "mirror_clean",
      category: "sanitary",
      nameDE: "Spiegel reinigen",
      nameTR: "Ayna temizleme",
      measurementType: "COUNT",
      unit: "Stk",
      baseRate: 1.2,
      rateType: "MINUTES_PER_UNIT",
      tool: "glass",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "CALIBRATION_REQUIRED",
    },
    {
      id: "kitchen_base",
      category: "kitchen",
      nameDE: "Teeküche Standardflächen",
      nameTR: "Çay mutfağı standart yüzeyler",
      measurementType: "ROOM",
      unit: "Küche",
      baseRate: 12,
      rateType: "MINUTES_PER_UNIT",
      tool: "cloth",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: ["kitchen_bin_empty"],
      excludesTaskIds: [],
      notes: "Includes accessible surfaces+sink+counter; bins via includesTaskIds intent",
    },
    {
      id: "kitchen_bin_empty",
      category: "kitchen",
      nameDE: "Küchenabfall leeren",
      nameTR: "Mutfak çöpü boşaltma",
      measurementType: "COUNT",
      unit: "Stk",
      baseRate: 0.5,
      rateType: "MINUTES_PER_UNIT",
      tool: "bin",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "Skipped when kitchen_base already counted includesTaskIds",
    },
    {
      id: "microwave_inside",
      category: "kitchen",
      nameDE: "Mikrowelle innen",
      nameTR: "Mikrodalga içi",
      measurementType: "COUNT",
      unit: "Stk",
      baseRate: 5,
      rateType: "MINUTES_PER_UNIT",
      tool: "cloth",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "Optional — never silent in routine",
    },
    {
      id: "stair_flight",
      category: "additional",
      nameDE: "Treppenlauf",
      nameTR: "Merdiven sahanlığı",
      measurementType: "COUNT",
      unit: "Etage",
      baseRate: 8,
      rateType: "MINUTES_PER_UNIT",
      tool: "mop",
      active: true,
      version: "v1-seed",
      sourceType: "ADMIN_ESTIMATE",
      status: "CALIBRATION_REQUIRED",
      sourceReference: "INTERNAL_SEED",
      includesTaskIds: [],
      excludesTaskIds: [],
      notes: "CALIBRATION_REQUIRED — not Fensterreinigung",
    },
  ],
};
