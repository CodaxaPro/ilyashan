"use client";

import type { CalendarAppointment } from "@/lib/calendar/types";
import type { StaffMemberSummary } from "@/lib/calendar/staff-lookup";
import { formatGermanDate } from "@/lib/quote-form";
import { CalendarEventCard } from "@/components/admin/calendar/CalendarEventCard";
import { weekdayLabelTr } from "@/lib/calendar/week-range";

interface CalendarAgendaViewProps {
  items: CalendarAppointment[];
  staffMembers: StaffMemberSummary[];
  onOpenLead: (leadId: string) => void;
}

export function CalendarAgendaView({ items, staffMembers, onOpenLead }: CalendarAgendaViewProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted text-sm" data-testid="calendar-agenda-empty">
        Filtrelere uygun randevu bulunamadı.
      </div>
    );
  }

  const grouped = groupByDate(items);

  return (
    <div className="space-y-4" data-testid="calendar-agenda-view">
      {Object.entries(grouped).map(([day, dayItems]) => (
        <section key={day} data-testid={`calendar-agenda-day-${day}`}>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-sm font-bold text-foreground">
              {weekdayLabelTr(day)} · {formatGermanDate(day)}
            </h3>
            <span className="text-xs text-muted">{dayItems.length} iş</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {dayItems.map((item) => (
              <CalendarEventCard
                key={item.id}
                item={item}
                staffMembers={staffMembers}
                onOpen={onOpenLead}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByDate(items: CalendarAppointment[]): Record<string, CalendarAppointment[]> {
  const grouped: Record<string, CalendarAppointment[]> = {};
  for (const item of items) {
    grouped[item.eventDate] ??= [];
    grouped[item.eventDate].push(item);
  }
  return grouped;
}
