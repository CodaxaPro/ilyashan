import { addCents, cents, type EuroCents } from "./money";
import type { CleaningEngineConfig } from "./seed-config";

export interface CostBreakdown {
  requiredPersonHours: number;
  billablePersonHours: number;
  laborCostCents: EuroCents;
  materialCostCents: EuroCents;
  consumablesCostCents: EuroCents;
  travelCostCents: EuroCents;
  vehicleCostCents: EuroCents;
  equipmentCostCents: EuroCents;
  setupCostCents: EuroCents;
  administrationAllocationCents: EuroCents;
  otherDirectCostCents: EuroCents;
  overheadCents: EuroCents;
  directCostCents: EuroCents;
  totalCostCents: EuroCents;
}

export function calculateJobCost(
  requiredPersonHours: number,
  config: CleaningEngineConfig,
  extras?: Partial<
    Pick<
      CostBreakdown,
      | "materialCostCents"
      | "consumablesCostCents"
      | "travelCostCents"
      | "vehicleCostCents"
      | "equipmentCostCents"
      | "setupCostCents"
      | "administrationAllocationCents"
      | "otherDirectCostCents"
    >
  >
): CostBreakdown {
  const billablePersonHours = Math.max(
    requiredPersonHours,
    config.minimumBillablePersonHours
  );

  const laborCostCents = cents(
    Math.round(billablePersonHours * config.productiveHourCostCents)
  );

  const materialCostCents = extras?.materialCostCents ?? cents(0);
  const consumablesCostCents = extras?.consumablesCostCents ?? cents(0);
  const travelCostCents = extras?.travelCostCents ?? cents(0);
  const vehicleCostCents = extras?.vehicleCostCents ?? cents(0);
  const equipmentCostCents = extras?.equipmentCostCents ?? cents(0);
  const setupCostCents = extras?.setupCostCents ?? cents(0);
  const administrationAllocationCents =
    extras?.administrationAllocationCents ?? cents(0);
  const otherDirectCostCents = extras?.otherDirectCostCents ?? cents(0);

  const directCostCents = addCents(
    laborCostCents,
    materialCostCents,
    consumablesCostCents,
    travelCostCents,
    vehicleCostCents,
    equipmentCostCents,
    setupCostCents,
    administrationAllocationCents,
    otherDirectCostCents
  );

  let overheadCents: EuroCents;
  if (config.overheadModel === "HOURLY_ALLOCATION") {
    overheadCents = cents(
      Math.round(billablePersonHours * config.overheadPerHourCents)
    );
  } else {
    overheadCents = cents(
      Math.round(directCostCents * config.overheadPercentOfDirect)
    );
  }

  const totalCostCents = addCents(directCostCents, overheadCents);

  return {
    requiredPersonHours,
    billablePersonHours,
    laborCostCents,
    materialCostCents,
    consumablesCostCents,
    travelCostCents,
    vehicleCostCents,
    equipmentCostCents,
    setupCostCents,
    administrationAllocationCents,
    otherDirectCostCents,
    overheadCents,
    directCostCents,
    totalCostCents,
  };
}
