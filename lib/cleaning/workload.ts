import type { CustomerInput } from "./types";
import type { CleaningEngineConfig, TaskRateSeed } from "./seed-config";

export interface TaskLine {
  taskId: string;
  nameDE: string;
  nameTR: string;
  quantity: number;
  unit: string;
  rateType: TaskRateSeed["rateType"];
  baseRate: number;
  rateVersion: string;
  factorProduct: number;
  minutes: number;
  excludedBy?: string;
}

export interface WorkloadResult {
  lines: TaskLine[];
  requiredPersonMinutes: number;
  requiredPersonHours: number;
}

function taskMinutes(task: TaskRateSeed, quantity: number, factor: number): number {
  if (quantity <= 0) return 0;
  if (task.rateType === "MINUTES_PER_UNIT") {
    return quantity * task.baseRate * factor;
  }
  // UNITS_PER_HOUR
  return (quantity / task.baseRate) * 60 * factor;
}

function applicableFactor(input: CustomerInput, config: CleaningEngineConfig): number {
  const cond = config.conditionFactors[input.condition] ?? 1;
  const usage = config.usageFactors[input.usageIntensity] ?? 1;
  const freq = config.frequencyWorkloadFactors[input.frequency] ?? 1;
  return cond * usage * freq;
}

function pushLine(
  lines: TaskLine[],
  task: TaskRateSeed | undefined,
  quantity: number,
  factor: number,
  excludedBy?: string
) {
  if (!task || !task.active || quantity <= 0) return;
  const minutes = excludedBy ? 0 : taskMinutes(task, quantity, factor);
  lines.push({
    taskId: task.id,
    nameDE: task.nameDE,
    nameTR: task.nameTR,
    quantity,
    unit: task.unit,
    rateType: task.rateType,
    baseRate: task.baseRate,
    rateVersion: task.version,
    factorProduct: factor,
    minutes,
    excludedBy,
  });
}

function byId(config: CleaningEngineConfig, id: string): TaskRateSeed | undefined {
  return config.tasks.find((t) => t.id === id);
}

/**
 * Task-based workloading. Floor m² tasks are independent of sanitary fixtures
 * (fixtures exclude wet_floor_clean). Kitchen base suppresses duplicate kitchen_bin lines.
 */
export function calculateWorkload(
  input: CustomerInput,
  config: CleaningEngineConfig
): WorkloadResult {
  const factor = applicableFactor(input, config);
  const lines: TaskLine[] = [];
  const includedOnce = new Set<string>();

  pushLine(lines, byId(config, "carpet_vacuum"), input.floors.carpet, factor);
  pushLine(lines, byId(config, "hard_floor_damp_mop"), input.floors.hard, factor);
  pushLine(lines, byId(config, "wet_floor_clean"), input.floors.wet, factor);

  pushLine(lines, byId(config, "desk_surfaces"), input.office.workstations, factor);
  pushLine(lines, byId(config, "office_bin_empty"), input.office.officeBins, factor);
  pushLine(lines, byId(config, "meeting_chair_wipe"), input.office.meetingChairs, factor);

  pushLine(lines, byId(config, "toilet_fixture"), input.sanitary.toilets, factor);
  pushLine(lines, byId(config, "urinal_fixture"), input.sanitary.urinals, factor);
  pushLine(lines, byId(config, "washbasin_fixture"), input.sanitary.washbasins, factor);
  pushLine(lines, byId(config, "mirror_clean"), input.sanitary.mirrors, factor);

  if (input.kitchen.kitchens > 0) {
    const kitchenBase = byId(config, "kitchen_base");
    pushLine(lines, kitchenBase, input.kitchen.kitchens, factor);
    if (kitchenBase) {
      for (const id of kitchenBase.includesTaskIds) {
        includedOnce.add(id);
      }
    }
    // Separate bin task only if not included in kitchen_base
    if (!includedOnce.has("kitchen_bin_empty")) {
      pushLine(lines, byId(config, "kitchen_bin_empty"), input.kitchen.bins, factor);
    } else if (input.kitchen.bins > 0) {
      pushLine(
        lines,
        byId(config, "kitchen_bin_empty"),
        input.kitchen.bins,
        factor,
        "kitchen_base"
      );
    }
    if (input.kitchen.microwaveInside) {
      pushLine(lines, byId(config, "microwave_inside"), input.kitchen.kitchens, factor);
    }
  }

  pushLine(lines, byId(config, "stair_flight"), input.additional.stairFloors, factor);

  const requiredPersonMinutes = lines.reduce((s, l) => s + l.minutes, 0);
  return {
    lines,
    requiredPersonMinutes,
    requiredPersonHours: requiredPersonMinutes / 60,
  };
}

/** Detect if the same taskId appears with positive minutes more than once. */
export function findDoubleCountedTaskIds(lines: TaskLine[]): string[] {
  const mins = new Map<string, number>();
  for (const line of lines) {
    if (line.minutes <= 0) continue;
    mins.set(line.taskId, (mins.get(line.taskId) ?? 0) + 1);
  }
  return [...mins.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}
