import type { CalendarAppointment, CalendarTimeSlot } from "@/lib/calendar/types";

export const DEFAULT_MAX_JOBS_PER_DAY = 6;
export const DEFAULT_MAX_JOBS_PER_SLOT = 3;

export interface DayCapacityWarning {
  date: string;
  count: number;
  max: number;
  level: "warning" | "critical";
}

export interface SlotCapacityWarning {
  date: string;
  timeSlot: CalendarTimeSlot;
  count: number;
  max: number;
}

export interface DuplicateDayWarning {
  date: string;
  customerName: string;
  customerPhone?: string;
  count: number;
}

export interface CapacityReport {
  maxPerDay: number;
  maxPerSlot: number;
  overCapacityDays: DayCapacityWarning[];
  slotWarnings: SlotCapacityWarning[];
  duplicateWarnings: DuplicateDayWarning[];
  warningCount: number;
}

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getMaxJobsPerDay(): number {
  return parseEnvInt("CALENDAR_MAX_JOBS_PER_DAY", DEFAULT_MAX_JOBS_PER_DAY);
}

export function getMaxJobsPerSlot(): number {
  return parseEnvInt("CALENDAR_MAX_JOBS_PER_SLOT", DEFAULT_MAX_JOBS_PER_SLOT);
}

/** Active jobs that consume daily capacity (exclude cancelled / done). */
export function countsTowardCapacity(item: CalendarAppointment): boolean {
  return item.status === "bestätigt" || item.status === "vorgeschlagen";
}

export function analyzeCapacity(
  items: CalendarAppointment[],
  days: string[],
  options?: { maxPerDay?: number; maxPerSlot?: number }
): CapacityReport {
  const maxPerDay = options?.maxPerDay ?? getMaxJobsPerDay();
  const maxPerSlot = options?.maxPerSlot ?? getMaxJobsPerSlot();
  const active = items.filter(countsTowardCapacity);

  const overCapacityDays: DayCapacityWarning[] = [];
  const slotWarnings: SlotCapacityWarning[] = [];
  const duplicateWarnings: DuplicateDayWarning[] = [];

  for (const day of days) {
    const dayItems = active.filter((i) => i.eventDate === day);
    if (dayItems.length > maxPerDay) {
      overCapacityDays.push({
        date: day,
        count: dayItems.length,
        max: maxPerDay,
        level: dayItems.length > maxPerDay + 1 ? "critical" : "warning",
      });
    }

    const bySlot = new Map<CalendarTimeSlot, number>();
    for (const item of dayItems) {
      const slot = item.timeSlot ?? "flexibel";
      bySlot.set(slot, (bySlot.get(slot) ?? 0) + 1);
    }
    for (const [timeSlot, count] of bySlot) {
      if (count > maxPerSlot) {
        slotWarnings.push({ date: day, timeSlot, count, max: maxPerSlot });
      }
    }

    const byCustomer = new Map<string, CalendarAppointment[]>();
    for (const item of dayItems) {
      const key = `${item.customerPhone ?? item.customerEmail ?? item.customerName}`.toLowerCase();
      const list = byCustomer.get(key) ?? [];
      list.push(item);
      byCustomer.set(key, list);
    }
    for (const group of byCustomer.values()) {
      if (group.length > 1) {
        duplicateWarnings.push({
          date: day,
          customerName: group[0].customerName,
          customerPhone: group[0].customerPhone,
          count: group.length,
        });
      }
    }
  }

  return {
    maxPerDay,
    maxPerSlot,
    overCapacityDays,
    slotWarnings,
    duplicateWarnings,
    warningCount: overCapacityDays.length + slotWarnings.length + duplicateWarnings.length,
  };
}
