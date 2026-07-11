"use client";

import type { UpcomingGroup, UpcomingSummary } from "@/lib/calendar/upcoming";
import { CalendarEventCard } from "@/components/admin/calendar/CalendarEventCard";

interface CalendarUpcomingPanelProps {
  summary: UpcomingSummary;
  groups: UpcomingGroup[];
  onOpenLead: (leadId: string) => void;
  onJumpToDate?: (iso: string) => void;
  compact?: boolean;
}

export function CalendarUpcomingPanel({
  summary,
  groups,
  onOpenLead,
  onJumpToDate,
  compact = false,
}: CalendarUpcomingPanelProps) {
  if (summary.totalActionable === 0) {
    return (
      <div
        className="rounded-2xl border border-border bg-white p-4 text-sm text-muted"
        data-testid="calendar-upcoming-empty"
      >
        Yaklaşan operasyon randevusu yok.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="calendar-upcoming-panel">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="Gecikmiş" value={summary.overdue} tone="danger" testId="upcoming-overdue" />
        <StatChip label="Bugün" value={summary.today} tone="primary" testId="upcoming-today" />
        <StatChip label="Yarın" value={summary.tomorrow} tone="info" testId="upcoming-tomorrow" />
        <StatChip label="Bu hafta" value={summary.week} tone="neutral" testId="upcoming-week" />
      </div>

      {!compact &&
        groups.map((group) => (
          <div key={group.bucket} data-testid={`upcoming-group-${group.bucket}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">{group.label}</h3>
              <span className="text-xs text-muted">{group.items.length} iş</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {group.items.map((item) => (
                <div key={item.id} className="relative">
                  <CalendarEventCard item={item} compact onOpen={onOpenLead} />
                  {onJumpToDate && (
                    <button
                      type="button"
                      onClick={() => onJumpToDate(item.eventDate)}
                      className="absolute top-2 right-2 text-[10px] font-semibold text-primary hover:underline"
                    >
                      Git →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
  testId,
}: {
  label: string;
  value: number;
  tone: "danger" | "primary" | "info" | "neutral";
  testId: string;
}) {
  const tones = {
    danger: "bg-red-50 text-red-800 border-red-200",
    primary: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-sky-50 text-sky-800 border-sky-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <div className={`rounded-xl border px-3 py-2 ${tones[tone]}`} data-testid={testId}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
