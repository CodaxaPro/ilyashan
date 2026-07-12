"use client";

import type { MonthWeekRow } from "@/lib/calendar/month-range";
import type { CalendarAppointment } from "@/lib/calendar/types";
import type { StaffMemberSummary } from "@/lib/calendar/staff-lookup";
import { resolveStaffMember } from "@/lib/calendar/staff-lookup";
import { isToday } from "@/lib/calendar/month-range";
import { weekdayLabelTr } from "@/lib/calendar/week-range";

interface CalendarMonthViewProps {
  weeks: MonthWeekRow[];
  byDay: Record<string, CalendarAppointment[]>;
  staffMembers: StaffMemberSummary[];
  today: string;
  onSelectDay: (iso: string) => void;
}

const WEEKDAY_HEADERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export function CalendarMonthView({ weeks, byDay, staffMembers, today, onSelectDay }: CalendarMonthViewProps) {
  return (
    <div data-testid="calendar-month-view" className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      <div className="grid grid-cols-6 bg-slate-50/90 border-b border-border">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="px-2 py-2.5 text-xs font-bold text-muted text-center uppercase tracking-wide">
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week) => (
        <div key={week.weekStart} className="grid grid-cols-6 border-b border-border last:border-b-0">
          {week.cells.map((iso, idx) => (
            <button
              key={`${week.weekStart}-${idx}`}
              type="button"
              disabled={!iso}
              data-testid={iso ? `calendar-month-day-${iso}` : undefined}
              onClick={() => iso && onSelectDay(iso)}
              className={`min-h-[120px] p-2 text-left border-r border-border last:border-r-0 transition-colors ${
                !iso
                  ? "bg-slate-50/50 cursor-default"
                  : isToday(iso, today)
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-slate-50/80"
              }`}
            >
              {iso && (
                <>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-sm font-bold ${
                        isToday(iso, today) ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {parseIsoDay(iso)}
                    </span>
                    <span className="text-[9px] text-muted font-medium">{weekdayLabelTr(iso)}</span>
                  </div>
                  <div className="space-y-1">
                    {(byDay[iso] ?? []).slice(0, 4).map((item) => {
                      const staff = resolveStaffMember(item.staffId, staffMembers);
                      const color = staff?.color ?? "#94a3b8";
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-1 truncate text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 shadow-sm"
                          style={{ borderLeftWidth: 3, borderLeftColor: color }}
                        >
                          <span className="truncate font-medium text-foreground">
                            {item.plannedStartTime
                              ? `${item.plannedStartTime} `
                              : ""}
                            {item.customerName}
                          </span>
                        </div>
                      );
                    })}
                    {(byDay[iso]?.length ?? 0) > 4 && (
                      <p className="text-[9px] text-primary font-semibold pl-1">
                        +{(byDay[iso]?.length ?? 0) - 4} daha
                      </p>
                    )}
                    {(byDay[iso]?.length ?? 0) === 0 && (
                      <p className="text-[10px] text-muted/60 pl-0.5">—</p>
                    )}
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function parseIsoDay(iso: string): number {
  return Number(iso.split("-")[2]);
}
