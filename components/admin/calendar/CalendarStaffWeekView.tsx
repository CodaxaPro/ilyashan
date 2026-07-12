"use client";

import type { CalendarAppointment } from "@/lib/calendar/types";
import type { StaffMemberSummary } from "@/lib/calendar/staff-lookup";
import { isToday } from "@/lib/calendar/month-range";
import { weekdayLabelTr } from "@/lib/calendar/week-range";
import { formatGermanDate } from "@/lib/quote-form";
import { CalendarEventCard } from "@/components/admin/calendar/CalendarEventCard";

interface StaffLane {
  key: string;
  name: string;
  color: string;
}

interface CalendarStaffWeekViewProps {
  days: string[];
  byDay: Record<string, CalendarAppointment[]>;
  staffMembers: StaffMemberSummary[];
  today: string;
  onOpenLead: (leadId: string) => void;
  onAssignStaff?: (appointmentId: string, staffId: string | null) => void;
  assigningId?: string | null;
}

function buildLanes(staffMembers: StaffMemberSummary[]): StaffLane[] {
  const lanes = staffMembers.map((m) => ({ key: m.id, name: m.name, color: m.color }));
  lanes.push({ key: "unassigned", name: "Atanmamış", color: "#94a3b8" });
  return lanes;
}

function laneItems(items: CalendarAppointment[], laneKey: string): CalendarAppointment[] {
  if (laneKey === "unassigned") return items.filter((i) => !i.staffId);
  return items.filter((i) => i.staffId === laneKey);
}

export function CalendarStaffWeekView({
  days,
  byDay,
  staffMembers,
  today,
  onOpenLead,
  onAssignStaff,
  assigningId,
}: CalendarStaffWeekViewProps) {
  const lanes = buildLanes(staffMembers);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm" data-testid="calendar-staff-week-view">
      <div className="min-w-[900px]">
        <div
          className="grid border-b border-border bg-slate-50/90"
          style={{ gridTemplateColumns: `140px repeat(${days.length}, minmax(140px, 1fr))` }}
        >
          <div className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted border-r border-border">
            Ekip
          </div>
          {days.map((day) => (
            <div
              key={day}
              className={`px-2 py-2.5 border-r border-border last:border-r-0 ${
                isToday(day, today) ? "bg-primary/10" : ""
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-muted">{weekdayLabelTr(day)}</p>
              <p className="text-xs font-bold text-foreground">{formatGermanDate(day)}</p>
            </div>
          ))}
        </div>

        {lanes.map((lane) => (
          <div
            key={lane.key}
            className="grid border-b border-border last:border-b-0"
            style={{ gridTemplateColumns: `140px repeat(${days.length}, minmax(140px, 1fr))` }}
          >
            <div
              className="px-3 py-3 border-r border-border flex items-start gap-2 bg-slate-50/50"
              style={{ borderLeftWidth: 4, borderLeftColor: lane.color }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: lane.color }}
                aria-hidden
              />
              <div>
                <p className="text-xs font-bold text-foreground">{lane.name}</p>
                <p className="text-[10px] text-muted">
                  {days.reduce(
                    (sum, day) => sum + laneItems(byDay[day] ?? [], lane.key).length,
                    0
                  )}{" "}
                  iş
                </p>
              </div>
            </div>

            {days.map((day) => {
              const items = laneItems(byDay[day] ?? [], lane.key);
              return (
                <div
                  key={`${lane.key}-${day}`}
                  className={`p-2 border-r border-border last:border-r-0 min-h-[100px] space-y-2 ${
                    isToday(day, today) ? "bg-primary/[0.03]" : ""
                  }`}
                  data-testid={`staff-lane-${lane.key}-${day}`}
                >
                  {items.length === 0 ? (
                    <p className="text-[10px] text-muted/50 italic text-center py-4">—</p>
                  ) : (
                    items.map((item) => (
                      <CalendarEventCard
                        key={item.id}
                        item={item}
                        staffMembers={staffMembers}
                        compact
                        onOpen={onOpenLead}
                        onAssignStaff={onAssignStaff}
                        assigning={assigningId === item.id}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
