import type { CalendarAppointment } from "@/lib/calendar/types";

export interface CalendarDayStats {
  total: number;
  bestätigt: number;
  vorgeschlagen: number;
  erledigt: number;
  wartung: number;
}

export interface CalendarRangeStats {
  total: number;
  byStatus: Record<string, number>;
  byKind: Record<string, number>;
  byDay: Record<string, CalendarDayStats>;
  busiestDay: string | null;
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
  const byDay: Record<string, CalendarDayStats> = Object.fromEntries(
    days.map((d) => [d, statsForDay([])])
  );

  const byStatus: Record<string, number> = {};
  const byKind: Record<string, number> = {};

  for (const item of items) {
    byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
    byKind[item.kind] = (byKind[item.kind] ?? 0) + 1;
  }

  for (const day of days) {
    byDay[day] = statsForDay(items.filter((i) => i.eventDate === day));
  }

  let busiestDay: string | null = null;
  let max = 0;
  for (const day of days) {
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
  };
}
