import type { BookableTimeSlot } from "@/lib/scheduling/slot-engine";
import type { DayAvailability } from "@/lib/scheduling/slot-engine";
import { normalizeTimeInput } from "@/lib/scheduling/appointment-times";

export interface CustomerArrivalOption {
  id: string;
  timeSlot: BookableTimeSlot;
  startTime?: string;
  labelDe: string;
  groupDe: "Vormittag" | "Nachmittag" | "Flexibel";
}

export const MORNING_ARRIVAL_TIMES = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] as const;
export const AFTERNOON_ARRIVAL_TIMES = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"] as const;

export function deriveTimeSlotFromStartTime(time: string): BookableTimeSlot | null {
  const normalized = normalizeTimeInput(time);
  if (!normalized) return null;
  const [h, m] = normalized.split(":").map(Number);
  const minutes = h * 60 + m;
  if (minutes < 8 * 60 || minutes > 17 * 60) return null;
  if (minutes < 12 * 60) return "vormittag";
  if (minutes >= 13 * 60) return "nachmittag";
  return null;
}

export function isCustomerArrivalTimeAllowed(time: string): boolean {
  return deriveTimeSlotFromStartTime(time) !== null;
}

function slotAvailable(day: DayAvailability, timeSlot: BookableTimeSlot): boolean {
  return day.slots.find((s) => s.timeSlot === timeSlot)?.available ?? false;
}

export function buildCustomerArrivalOptions(day: DayAvailability): CustomerArrivalOption[] {
  const options: CustomerArrivalOption[] = [];

  if (slotAvailable(day, "vormittag")) {
    for (const startTime of MORNING_ARRIVAL_TIMES) {
      options.push({
        id: startTime,
        timeSlot: "vormittag",
        startTime,
        labelDe: `${startTime} Uhr`,
        groupDe: "Vormittag",
      });
    }
  }

  if (slotAvailable(day, "nachmittag")) {
    for (const startTime of AFTERNOON_ARRIVAL_TIMES) {
      options.push({
        id: startTime,
        timeSlot: "nachmittag",
        startTime,
        labelDe: `${startTime} Uhr`,
        groupDe: "Nachmittag",
      });
    }
  }

  if (slotAvailable(day, "flexibel")) {
    options.push({
      id: "flexibel",
      timeSlot: "flexibel",
      labelDe: "Flexibel — genaue Uhrzeit teilen wir Ihnen mit",
      groupDe: "Flexibel",
    });
  }

  return options;
}

export function findCustomerArrivalOption(
  day: DayAvailability,
  optionId: string
): CustomerArrivalOption | null {
  return buildCustomerArrivalOptions(day).find((o) => o.id === optionId) ?? null;
}

export function formatCustomerArrivalLabel(option: CustomerArrivalOption): string {
  if (option.timeSlot === "flexibel") return option.labelDe;
  return `Ankunft gegen ${option.labelDe}`;
}
