"use client";

import type { CalendarAppointment } from "@/lib/calendar/types";
import { canRescheduleAppointment } from "@/lib/calendar/appointment-from-lead";
import { isToday } from "@/lib/calendar/month-range";
import { weekdayLabelTr } from "@/lib/calendar/week-range";
import { formatGermanDate } from "@/lib/quote-form";
import { CalendarEventCard } from "@/components/admin/calendar/CalendarEventCard";
import type { CalendarDayStats } from "@/lib/calendar/stats";

interface CalendarWeekViewProps {
  days: string[];
  byDay: Record<string, CalendarAppointment[]>;
  dayStats: Record<string, CalendarDayStats>;
  today: string;
  draggingId: string | null;
  onOpenLead: (leadId: string) => void;
  onDragStart: (item: CalendarAppointment, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (targetDate: string) => void;
  setDraggingId: (id: string | null) => void;
}

export function CalendarWeekView({
  days,
  byDay,
  dayStats,
  today,
  draggingId,
  onOpenLead,
  onDragStart,
  onDragEnd,
  onDrop,
  setDraggingId,
}: CalendarWeekViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="calendar-week-view">
      {days.map((day) => {
        const items = byDay[day] ?? [];
        const stats = dayStats[day];
        return (
          <div
            key={day}
            data-testid={`calendar-day-${day}`}
            className={`min-h-[240px] rounded-2xl border p-3 flex flex-col gap-2 ${
              isToday(day, today) ? "border-primary bg-primary/5" : "border-border bg-white"
            }`}
            onDragOver={(e) => {
              if (draggingId) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDraggingId(null);
              onDrop(day);
            }}
          >
            <div className="border-b border-border pb-2">
              <p className="text-xs font-bold text-primary uppercase">{weekdayLabelTr(day)}</p>
              <p className="text-sm font-semibold text-foreground">{formatGermanDate(day)}</p>
              <p className="text-[10px] text-muted">
                {stats?.total ?? items.length} iş
                {stats && stats.wartung > 0 ? ` · ${stats.wartung} Wartung` : ""}
              </p>
            </div>

            <div className="flex-1 space-y-2">
              {items.length === 0 ? (
                <p className="text-[11px] text-muted italic py-4 text-center">Boş</p>
              ) : (
                items.map((item) => (
                  <CalendarEventCard
                    key={item.id}
                    item={item}
                    draggable={canRescheduleAppointment(item)}
                    dragging={draggingId === item.id}
                    onOpen={onOpenLead}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
