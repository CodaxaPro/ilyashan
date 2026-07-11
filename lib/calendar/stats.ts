import type { CalendarAppointment } from "@/lib/calendar/types";
import type { CapacityReport } from "@/lib/calendar/capacity";
import { analyzeCapacity } from "@/lib/calendar/capacity";

export interface CalendarDayStats {
  total: number;
  bestätigt: number;
  vorgeschlagen: number;
  erledigt: number;
  wartung: number;
  overCapacity?: boolean;
}

export interface CalendarRangeStats {
  total: number;
  byStatus: Record<string, number>;
  byKind: Record<string, number>;
  byDay: Record<string, CalendarDayStats>;
  busiestDay: string | null;
  capacity: CapacityReport;
}

export function statsForDay(items: CalendarAppointment[]): CalendarDayStats {
  return {
    total: items.length,
    bestätigt: items.filter((i) => i.status === "bestätigt").length,
    vorgeschlagen: items.filter((i) => i.status === "vorgeschlagen").length,
    erledigt: items.filter((i) => i.status === "erledigt").length,
    wartung: items.filter((i) => i.kind === "wartung").length,
  };
}

export function buildRangeStats(
  items: CalendarAppointment[],
  days: string[]
): CalendarRangeStats {
  const dayKeys = days.length ? days : [...new Set(items.map((i) => i.eventDate))].sort();
  const capacity = analyzeCapacity(items, dayKeys);
  const overSet = new Set(capacity.overCapacityDays.map((d) => d.date));

  const byDay: Record<string, CalendarDayStats> = Object.fromEntries(
    dayKeys.map((d) => [d, statsForDay([])])
  );

  const byStatus: Record<string, number> = {};
  const byKind: Record<string, number> = {};

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    byKind[item.kind] = (byKind[item.kind] ?? 0) + 1;
  }

  for (const day of dayKeys) {
    const dayStats = statsForDay(items.filter((i) => i.eventDate === day));
    dayStats.overCapacity = overSet.has(day);
    byDay[day] = dayStats;
  }

  let busiestDay: string | null = null;
  let max = 0;
  for (const day of dayKeys) {
    if (byDay[day].total > max) {
      max = byDay[day].total;
      busiestDay = day;
    }
  }

  return {
    total: items.length,
    byStatus,
    byKind,
    byDay,
    busiestDay,
    capacity,
  };
}
