"use client";

import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS_TR,
  appointmentRoleColorClass,
  appointmentRoleLabelTr,
  TIME_SLOT_LABELS_TR,
} from "@/lib/calendar/appointment-from-lead";
import { buildGoogleCalendarAddUrl, isGoogleCalendarLinkVisible } from "@/lib/calendar/google-calendar";
import type { CalendarAppointment } from "@/lib/calendar/types";
import type { StaffMemberSummary } from "@/lib/calendar/staff-lookup";
import { resolveStaffMember } from "@/lib/calendar/staff-lookup";
import { formatGermanDate } from "@/lib/quote-form";
import { formatTimeDe, formatDurationDe } from "@/lib/scheduling/appointment-times";
import { StaffBadge } from "@/components/admin/calendar/StaffBadge";

interface CalendarEventCardProps {
  item: CalendarAppointment;
  staffMembers?: StaffMemberSummary[];
  compact?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  assigning?: boolean;
  onOpen: (leadId: string) => void;
  onDragStart?: (item: CalendarAppointment, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onAssignStaff?: (appointmentId: string, staffId: string | null) => void;
}

export function CalendarEventCard({
  item,
  staffMembers = [],
  compact = false,
  draggable = false,
  dragging = false,
  assigning = false,
  onOpen,
  onDragStart,
  onDragEnd,
  onAssignStaff,
}: CalendarEventCardProps) {
  const staff = resolveStaffMember(item.staffId, staffMembers);
  const accentColor = staff?.color ?? "#94a3b8";
  const timeLabel = item.plannedStartTime
    ? formatTimeDe(item.plannedStartTime)
    : item.timeSlot
      ? TIME_SLOT_LABELS_TR[item.timeSlot] ?? item.timeSlot
      : null;

  return (
    <div
      data-testid={`calendar-event-${item.id}`}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(item, e)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border bg-white shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-px ${
        dragging ? "opacity-50 scale-[0.98]" : ""
      } ${compact ? "p-2" : "p-2.5"}`}
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
      onClick={() => onOpen(item.leadId)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          {timeLabel && (
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted mb-0.5">
              {timeLabel}
              {item.estimatedDurationHours
                ? ` · ${formatDurationDe(item.estimatedDurationHours)}`
                : ""}
            </p>
          )}
          <p className={`font-bold text-foreground truncate ${compact ? "text-xs" : "text-sm"}`}>
            {item.customerName}
          </p>
        </div>
        <span
          className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${APPOINTMENT_STATUS_COLORS[item.status]}`}
        >
          {APPOINTMENT_STATUS_LABELS_TR[item.status]}
        </span>
      </div>

      <p className="text-[10px] text-muted truncate">
        {[item.city, item.postalCode].filter(Boolean).join(" · ") || "—"}
        {item.windowCount ? ` · ${item.windowCount} Flügel` : ""}
      </p>

      <div className="flex flex-wrap items-center gap-1 mt-2">
        {onAssignStaff && staffMembers.length > 0 ? (
          <select
            value={item.staffId ?? ""}
            disabled={assigning}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              const value = e.target.value;
              onAssignStaff(item.id, value || null);
            }}
            className="text-[9px] font-semibold rounded-md border border-border bg-white px-1 py-0.5 max-w-[110px]"
            data-testid={`staff-assign-${item.id}`}
          >
            <option value="">Atanmamış</option>
            {staffMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <StaffBadge member={staff} size="sm" />
        )}
        <span
          className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${appointmentRoleColorClass(String(item.role))}`}
        >
          {appointmentRoleLabelTr(String(item.role))}
        </span>
        {item.kind === "wartung" && (
          <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border-blue-200">
            Wartung
          </span>
        )}
      </div>

      {!compact && (
        <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap items-center gap-2 text-[10px]">
          {item.anfrageNr && (
            <span className="font-mono text-muted">{item.anfrageNr}</span>
          )}
          {item.customerPhone && (
            <a
              href={`tel:${item.customerPhone.replace(/\s/g, "")}`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary font-semibold hover:underline"
            >
              {item.customerPhone}
            </a>
          )}
          {isGoogleCalendarLinkVisible(item) && (
            <a
              href={buildGoogleCalendarAddUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-700 font-semibold hover:underline"
              data-testid={`calendar-google-${item.id}`}
            >
              Google
            </a>
          )}
          <span className="text-muted ml-auto">{formatGermanDate(item.eventDate)}</span>
        </div>
      )}
    </div>
  );
}
