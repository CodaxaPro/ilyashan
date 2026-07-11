"use client";

import type { MonthWeekRow } from "@/lib/calendar/month-range";
import type { CalendarAppointment } from "@/lib/calendar/types";
import { isToday } from "@/lib/calendar/month-range";
import { weekdayLabelTr } from "@/lib/calendar/week-range";
import { formatGermanDate } from "@/lib/quote-form";

interface CalendarMonthViewProps {
  weeks: MonthWeekRow[];
  byDay: Record<string, CalendarAppointment[]>;
  today: string;
  onSelectDay: (iso: string) => void;
}

const WEEKDAY_HEADERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export function CalendarMonthView({ weeks, byDay, today, onSelectDay }: CalendarMonthViewProps) {
  return (
    <div data-testid="calendar-month-view" className="rounded-2xl border border-border bg-white overflow-hidden">
      <div className="grid grid-cols-6 bg-slate-50 border-b border-border">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="px-2 py-2 text-xs font-bold text-muted text-center">
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
              className={`min-h-[110px] p-2 text-left border-r border-border last:border-r-0 ${
                !iso
                  ? "bg-slate-50/50 cursor-default"
                  : isToday(iso, today)
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-slate-50"
              }`}
            >
              {iso && (
                <>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-sm font-bold text-foreground">{parseIsoDay(iso)}</span>
                    <span className="text-[9px] text-muted">{weekdayLabelTr(iso)}</span>
                  </div>
                  <div className="space-y-1">
                    {(byDay[iso] ?? []).slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="truncate text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200"
                      >
                        {item.customerName}
                      </div>
                    ))}
                    {(byDay[iso]?.length ?? 0) > 3 && (
                      <p className="text-[9px] text-primary font-semibold">
                        +{(byDay[iso]?.length ?? 0) - 3} daha
                      </p>
                    )}
                    {(byDay[iso]?.length ?? 0) === 0 && (
                      <p className="text-[10px] text-muted">—</p>
                    )}
                  </div>
                  <p className="text-[9px] text-muted mt-1">{formatGermanDate(iso)}</p>
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
