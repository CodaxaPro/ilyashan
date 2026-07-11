"use client";

import type { CalendarRangeStats } from "@/lib/calendar/stats";
import type { UpcomingSummary } from "@/lib/calendar/upcoming";

interface CalendarStatsBarProps {
  stats: CalendarRangeStats;
  upcoming: UpcomingSummary;
}

export function CalendarStatsBar({ stats, upcoming }: CalendarStatsBarProps) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-5 gap-3"
      data-testid="calendar-stats-bar"
    >
      <MiniStat label="Toplam" value={stats.total} />
      <MiniStat label="Onaylı" value={stats.byStatus.bestätigt ?? 0} />
      <MiniStat label="Önerilen" value={stats.byStatus.vorgeschlagen ?? 0} />
      <MiniStat label="Wartung" value={stats.byKind.wartung ?? 0} />
      <MiniStat label="Uyarı" value={upcoming.badgeCount} highlight={upcoming.badgeCount > 0} />
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        highlight ? "border-amber-300 bg-amber-50" : "border-border bg-slate-50"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
