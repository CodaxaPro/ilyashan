import type { CustomerInput, QuoteStatus } from "./types";
import { DEFAULT_CLEANING_CONFIG, type CleaningEngineConfig } from "./seed-config";
import { validateCustomerInput, hasBlockingErrors, requiresManualReview } from "./validation";
import type { ValidationIssue } from "./validation";
import { calculateWorkload, type WorkloadResult } from "./workload";
import { recommendTeam, type TeamRecommendation } from "./team";
import { calculateJobCost, type CostBreakdown } from "./cost";
import { calculatePrice, type PriceBreakdown } from "./pricing";

/** Customer-safe quote result — no labor rates, margin internals as optional admin-only. */
export interface CustomerQuoteSummary {
  quoteStatus: QuoteStatus;
  netCents: number;
  vatCents: number;
  grossCents: number;
  frequency: CustomerInput["frequency"];
  totalAreaM2: number;
  recommendedWorkers: number;
  estimatedOnsiteHours: number;
  language: "de" | "tr";
}

export interface AdminQuoteDetail {
  configVersionId: string;
  validation: ValidationIssue[];
  workload: WorkloadResult;
  team: TeamRecommendation;
  cost: CostBreakdown;
  price: PriceBreakdown;
}

export interface QuoteCalculation {
  customer: CustomerQuoteSummary;
  /** Present for server/admin; strip before public JSON if ever serialized together */
  admin: AdminQuoteDetail;
}

export function calculateOfficeCleaningQuote(
  input: CustomerInput,
  config: CleaningEngineConfig = DEFAULT_CLEANING_CONFIG
): QuoteCalculation {
  const validation = validateCustomerInput(input);
  if (hasBlockingErrors(validation)) {
    const emptyWorkload: WorkloadResult = {
      lines: [],
      requiredPersonMinutes: 0,
      requiredPersonHours: 0,
    };
    const cost = calculateJobCost(0, config);
    // Customer-facing Dauer follows billable visit time (min. Pers.-Std.), not raw workload.
    const team = recommendTeam(cost.billablePersonHours, config);
    const price = calculatePrice(cost.totalCostCents, input.frequency, config, {
      forceManualReview: true,
      overrideStatus: "MANUAL_REVIEW_REQUIRED",
    });
    return {
      customer: toCustomer(input, team, price, config),
      admin: {
        configVersionId: config.configVersionId,
        validation,
        workload: emptyWorkload,
        team,
        cost,
        price,
      },
    };
  }

  const workload = calculateWorkload(input, config);
  const cost = calculateJobCost(workload.requiredPersonHours, config);
  // Historical Büro invoices (Dyckhoff etc.) billed ~1–2.5 Std, median ~2 Std.
  // Show commercial onsite from billable hours so UI Dauer matches minimum visit / price.
  const team = recommendTeam(cost.billablePersonHours, config);
  const forceManual = requiresManualReview(input, validation);
  const price = calculatePrice(cost.totalCostCents, input.frequency, config, {
    forceManualReview: forceManual,
  });

  return {
    customer: toCustomer(input, team, price, config),
    admin: {
      configVersionId: config.configVersionId,
      validation,
      workload,
      team,
      cost,
      price,
    },
  };
}

function toCustomer(
  input: CustomerInput,
  team: TeamRecommendation,
  price: PriceBreakdown,
  _config: CleaningEngineConfig = DEFAULT_CLEANING_CONFIG
): CustomerQuoteSummary {
  // Dauer = team onsite from billable person-hours (not raw workload floor alone).
  // Do not inflate multi-person visits by forcing min Pers.-Std. onto clock time.
  const estimatedOnsiteHours = Math.max(team.onsiteHoursRounded, 0.5);
  return {
    quoteStatus: price.quoteStatus,
    netCents: price.roundedNetCents,
    vatCents: price.vatCents,
    grossCents: price.grossCents,
    frequency: input.frequency,
    totalAreaM2: input.totalAreaM2,
    recommendedWorkers: team.workers,
    estimatedOnsiteHours,
    language: input.language,
  };
}

/** Public API shape — never includes admin. */
export function toPublicQuotePayload(calc: QuoteCalculation): CustomerQuoteSummary {
  return { ...calc.customer };
}
