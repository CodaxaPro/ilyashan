import type { CalendarViewMode } from "@/lib/calendar/filters";
import { getMonthRange, parseMonthParam } from "@/lib/calendar/month-range";
import { addDaysIso, getWeekRange, toIsoDate } from "@/lib/calendar/week-range";

export interface CalendarQueryRange {
  view: CalendarViewMode;
  from: string;
  to: string;
  days: string[];
  week?: { start: string; end: string; days: string[] };
  month?: { year: number; month: number; start: string; end: string; days: string[] };
}

export function resolveCalendarQueryRange(params: URLSearchParams): CalendarQueryRange {
  const view = (params.get("view") as CalendarViewMode | null) ?? "week";
  const today = toIsoDate(new Date());

  if (view === "month") {
    const parsed =
      parseMonthParam(params.get("month")) ??
      (() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
      })();
    const month = getMonthRange(parsed.year, parsed.month);
    return {
      view: "month",
      from: month.start,
      to: month.end,
      days: month.days,
      month: { year: month.year, month: month.month, start: month.start, end: month.end, days: month.days },
    };
  }

  if (view === "agenda") {
    const from = params.get("from") ?? today;
    const to = params.get("to") ?? addDaysIso(today, 30);
    return { view: "agenda", from, to, days: [] };
  }

  const weekStart = params.get("weekStart");
  const week = weekStart
    ? getWeekRange(new Date(weekStart + "T12:00:00"))
    : getWeekRange();
  return {
    view: "week",
    from: week.start,
    to: week.end,
    days: week.days,
    week,
  };
}

export function resolveUpcomingFetchRange(today = toIsoDate(new Date())): { from: string; to: string } {
  return {
    from: addDaysIso(today, -30),
    to: addDaysIso(today, 14),
  };
}
