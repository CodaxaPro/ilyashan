"use client";

import type { CalendarAppointment } from "@/lib/calendar/types";
import type { StaffMemberSummary } from "@/lib/calendar/staff-lookup";
import { canRescheduleAppointment } from "@/lib/calendar/appointment-from-lead";
import { isToday } from "@/lib/calendar/month-range";
import { weekdayLabelTr } from "@/lib/calendar/week-range";
import { formatGermanDate } from "@/lib/quote-form";
import { groupAppointmentsByTimeSlot } from "@/lib/calendar/time-slot-groups";
import { CalendarEventCard } from "@/components/admin/calendar/CalendarEventCard";
import type { CalendarDayStats } from "@/lib/calendar/stats";

interface CalendarWeekViewProps {
  days: string[];
  byDay: Record<string, CalendarAppointment[]>;
  dayStats: Record<string, CalendarDayStats>;
  staffMembers: StaffMemberSummary[];
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
  staffMembers,
  today,
  draggingId,
  onOpenLead,
  onDragStart,
  onDragEnd,
  onDrop,
  setDraggingId,
}: CalendarWeekViewProps) {
  return (
    <div
      className="overflow-x-auto pb-2 -mx-1 px-1"
      data-testid="calendar-week-view"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 min-w-0 xl:min-w-full">
        {days.map((day) => {
          const items = byDay[day] ?? [];
          const stats = dayStats[day];
          const sections = groupAppointmentsByTimeSlot(items);
          const isTodayCol = isToday(day, today);

          return (
            <div
              key={day}
              data-testid={`calendar-day-${day}`}
              className={`min-h-[320px] min-w-[220px] rounded-2xl border flex flex-col overflow-hidden transition-shadow ${
                stats?.overCapacity
                  ? "border-amber-400 bg-gradient-to-b from-amber-50/80 to-white shadow-sm"
                  : isTodayCol
                    ? "border-primary/40 bg-gradient-to-b from-primary/8 to-white shadow-md ring-1 ring-primary/10"
                    : "border-border bg-white shadow-sm"
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
              <div
                className={`px-3 py-2.5 border-b ${
                  isTodayCol ? "border-primary/20 bg-primary/5" : "border-border bg-slate-50/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isTodayCol ? "text-primary" : "text-muted"
                      }`}
                    >
                      {weekdayLabelTr(day)}
                    </p>
                    <p className="text-sm font-bold text-foreground">{formatGermanDate(day)}</p>
                  </div>
                  {isTodayCol && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary text-white">
                      Bugün
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted mt-1">
                  {stats?.total ?? items.length} iş
                  {stats && stats.wartung > 0 ? ` · ${stats.wartung} Wartung` : ""}
                  {stats?.overCapacity ? " · Kapasite aşıldı" : ""}
                </p>
              </div>

              <div className="flex-1 p-2 space-y-3 overflow-y-auto max-h-[480px]">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-[11px] text-muted italic">Boş gün</p>
                  </div>
                ) : (
                  sections.map(({ section, items: sectionItems }) => (
                    <div key={section?.key ?? "default"}>
                      {section && (
                        <div className="flex items-center gap-2 mb-1.5 px-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-muted">
                            {section.label}
                          </p>
                          {section.hint && (
                            <span className="text-[9px] text-muted/80">{section.hint}</span>
                          )}
                          <span className="text-[9px] font-semibold text-primary ml-auto">
                            {sectionItems.length}
                          </span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {sectionItems.map((item) => (
                          <CalendarEventCard
                            key={item.id}
                            item={item}
                            staffMembers={staffMembers}
                            draggable={canRescheduleAppointment(item)}
                            dragging={draggingId === item.id}
                            onOpen={onOpenLead}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
