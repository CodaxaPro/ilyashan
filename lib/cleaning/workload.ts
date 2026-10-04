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
 * Hybrid workloading (v3):
 * 1) Primary time from subAreas × RAL-derived room rates
 * 2) Carpet surcharge from floors.carpet (no full double floor mop)
 * 3) Wet m² above sanitary room area
 * 4) Counts / booleans refine density and options
 * 5) Fixed Rüst-/Wegezeit per visit
 */
export function calculateWorkload(
  input: CustomerInput,
  config: CleaningEngineConfig
): WorkloadResult {
  const factor = applicableFactor(input, config);
  const lines: TaskLine[] = [];
  const includedOnce = new Set<string>();
  const { subAreas, floors } = input;
  const roomSum =
    subAreas.office +
    subAreas.meeting +
    subAreas.kitchen +
    subAreas.sanitary +
    subAreas.corridors +
    subAreas.reception +
    subAreas.other;

  // —— Rooms (primary) ——
  pushLine(lines, byId(config, "room_office"), subAreas.office, factor);
  pushLine(lines, byId(config, "room_meeting"), subAreas.meeting, factor);
  pushLine(lines, byId(config, "room_kitchen"), subAreas.kitchen, factor);
  pushLine(lines, byId(config, "room_sanitary"), subAreas.sanitary, factor);
  pushLine(lines, byId(config, "room_corridors"), subAreas.corridors, factor);
  pushLine(lines, byId(config, "room_reception"), subAreas.reception, factor);
  pushLine(lines, byId(config, "room_other"), subAreas.other, factor);

  // Fallback if subAreas empty (blocked by validation in normal quotes)
  if (roomSum <= 0 && input.totalAreaM2 > 0) {
    pushLine(lines, byId(config, "room_office"), input.totalAreaM2, factor);
  }
  pushLine(lines, byId(config, "carpet_surcharge"), floors.carpet, factor);
  const wetExtra = Math.max(0, floors.wet - subAreas.sanitary);
  pushLine(lines, byId(config, "wet_floor_clean"), wetExtra, factor);

  // —— Office ——
  const desks = input.office.workstations;
  pushLine(lines, byId(config, "desk_surfaces"), desks, factor);
  pushLine(lines, byId(config, "office_bin_empty"), input.office.officeBins, factor);
  pushLine(lines, byId(config, "meeting_chair_wipe"), input.office.meetingChairs, factor);
  if (input.office.cabinetExterior) {
    pushLine(lines, byId(config, "cabinet_exterior"), Math.max(desks, 1), factor);
  }
  if (input.office.shelving) {
    pushLine(lines, byId(config, "shelving_wipe"), Math.max(desks, 1), factor);
  }
  if (input.office.windowSills) {
    const sillQty = Math.max(desks, input.office.meetingRooms * 2, 1);
    pushLine(lines, byId(config, "window_sill_wipe"), sillQty, factor);
  }
  if (input.office.phoneMonitorExterior) {
    pushLine(lines, byId(config, "phone_monitor_exterior"), Math.max(desks, 1), factor);
  }
  if (input.office.whiteboards) {
    pushLine(
      lines,
      byId(config, "whiteboard_wipe"),
      Math.max(input.office.meetingRooms, 1),
      factor
    );
  }

  // —— Sanitary ——
  pushLine(lines, byId(config, "toilet_fixture"), input.sanitary.toilets, factor);
  pushLine(lines, byId(config, "urinal_fixture"), input.sanitary.urinals, factor);
  pushLine(lines, byId(config, "washbasin_fixture"), input.sanitary.washbasins, factor);
  pushLine(lines, byId(config, "mirror_clean"), input.sanitary.mirrors, factor);
  pushLine(lines, byId(config, "sanitary_bin_empty"), input.sanitary.sanitaryBins, factor);
  pushLine(lines, byId(config, "shower_fixture"), input.sanitary.showers, factor);
  pushLine(lines, byId(config, "cubicle_wipe"), input.sanitary.cubicles, factor);

  // —— Kitchen ——
  if (input.kitchen.kitchens > 0) {
    const kitchenBase = byId(config, "kitchen_base");
    pushLine(lines, kitchenBase, input.kitchen.kitchens, factor);
    if (kitchenBase) {
      for (const id of kitchenBase.includesTaskIds) {
        includedOnce.add(id);
      }
    }
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
    pushLine(lines, byId(config, "kitchen_table"), input.kitchen.tables, factor);
    pushLine(lines, byId(config, "kitchen_chair"), input.kitchen.chairs, factor);
    pushLine(lines, byId(config, "kitchen_sink"), input.kitchen.sinks, factor);
    pushLine(lines, byId(config, "kitchen_counter"), input.kitchen.countertopUnits, factor);
    pushLine(
      lines,
      byId(config, "appliance_exterior"),
      input.kitchen.applianceExteriors,
      factor
    );
    if (input.kitchen.microwaveInside) {
      pushLine(lines, byId(config, "microwave_inside"), input.kitchen.kitchens, factor);
    }
    if (input.kitchen.refrigeratorInside) {
      pushLine(lines, byId(config, "refrigerator_inside"), input.kitchen.kitchens, factor);
    }
    if (input.kitchen.dishwasher) {
      pushLine(lines, byId(config, "dishwasher_exterior"), input.kitchen.kitchens, factor);
    }
    if (input.kitchen.cabinetFronts) {
      pushLine(lines, byId(config, "kitchen_cabinet_fronts"), input.kitchen.kitchens, factor);
    }
    if (input.kitchen.dishes) {
      pushLine(lines, byId(config, "dishes_wash"), input.kitchen.kitchens, factor);
    }
  }

  // —— Additional ——
  pushLine(lines, byId(config, "stair_flight"), input.additional.stairFloors, factor);
  if (input.additional.elevator) {
    pushLine(lines, byId(config, "elevator_cabin"), 1, factor);
  }
  pushLine(
    lines,
    byId(config, "glass_entrance_door"),
    input.additional.glassEntranceDoors,
    factor
  );
  if (input.additional.receptionDetail) {
    pushLine(lines, byId(config, "reception_detail"), 1, factor);
  }
  if (input.additional.highTouchAreas && input.totalAreaM2 > 0) {
    pushLine(lines, byId(config, "high_touch_areas"), input.totalAreaM2, factor);
  }

  const productiveSoFar = lines.reduce((s, l) => s + l.minutes, 0);
  if (productiveSoFar > 0 || input.totalAreaM2 > 0) {
    pushLine(lines, byId(config, "setup_travel"), 1, factor);
  }

  const requiredPersonMinutes = lines.reduce((s, l) => s + l.minutes, 0);
  return {
    lines,
    requiredPersonMinutes,
    requiredPersonHours: requiredPersonMinutes / 60,
  };
}

export function findDoubleCountedTaskIds(lines: TaskLine[]): string[] {
  const mins = new Map<string, number>();
  for (const line of lines) {
    if (line.minutes <= 0) continue;
    mins.set(line.taskId, (mins.get(line.taskId) ?? 0) + 1);
  }
  return [...mins.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}
