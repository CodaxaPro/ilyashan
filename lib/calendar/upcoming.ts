import type { CalendarAppointment } from "@/lib/calendar/types";
import { compareAppointments } from "@/lib/calendar/sort";
import { addDaysIso, toIsoDate } from "@/lib/calendar/week-range";

export type UpcomingBucket = "overdue" | "today" | "tomorrow" | "week" | "later";

export interface UpcomingSummary {
  overdue: number;
  today: number;
  tomorrow: number;
  week: number;
  totalActionable: number;
  badgeCount: number;
}

export interface UpcomingGroup {
  bucket: UpcomingBucket;
  label: string;
  items: CalendarAppointment[];
}

const BUCKET_LABELS_TR: Record<UpcomingBucket, string> = {
  overdue: "Gecikmiş",
  today: "Bugün",
  tomorrow: "Yarın",
  week: "Bu hafta",
  later: "Daha sonra",
};

export function bucketForDate(
  eventDate: string,
  todayIso: string
): UpcomingBucket {
  if (eventDate < todayIso) return "overdue";
  if (eventDate === todayIso) return "today";
  if (eventDate === addDaysIso(todayIso, 1)) return "tomorrow";
  const weekEnd = addDaysIso(todayIso, 6);
  if (eventDate <= weekEnd) return "week";
  return "later";
}

export function isActionableUpcoming(item: CalendarAppointment, todayIso: string): boolean {
  if (item.status === "storniert" || item.status === "erledigt") return false;
  return item.eventDate <= addDaysIso(todayIso, 14);
}

export function buildUpcomingSummary(
  items: CalendarAppointment[],
  todayIso: string = toIsoDate(new Date())
): UpcomingSummary {
  const actionable = items.filter((item) => isActionableUpcoming(item, todayIso));
  const counts: Record<UpcomingBucket, number> = {
    overdue: 0,
    today: 0,
    tomorrow: 0,
    week: 0,
    later: 0,
  };

  for (const item of actionable) {
    counts[bucketForDate(item.eventDate, todayIso)] += 1;
  }

  const badgeCount = counts.overdue + counts.today + counts.tomorrow;

  return {
    overdue: counts.overdue,
    today: counts.today,
    tomorrow: counts.tomorrow,
    week: counts.week,
    totalActionable: actionable.length,
    badgeCount,
  };
}

export function groupUpcomingAppointments(
  items: CalendarAppointment[],
  todayIso: string = toIsoDate(new Date()),
  includeLater = false
): UpcomingGroup[] {
  const buckets: UpcomingBucket[] = includeLater
    ? ["overdue", "today", "tomorrow", "week", "later"]
    : ["overdue", "today", "tomorrow", "week"];

  const grouped: Record<UpcomingBucket, CalendarAppointment[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    week: [],
    later: [],
  };

  for (const item of items) {
    if (item.status === "storniert" || item.status === "erledigt") continue;
    const bucket = bucketForDate(item.eventDate, todayIso);
    if (!includeLater && bucket === "later") continue;
    grouped[bucket].push(item);
  }

  for (const bucket of buckets) {
    grouped[bucket].sort(compareAppointments);
  }

  return buckets
    .map((bucket) => ({
      bucket,
      label: BUCKET_LABELS_TR[bucket],
      items: grouped[bucket],
    }))
    .filter((group) => group.items.length > 0);
}
