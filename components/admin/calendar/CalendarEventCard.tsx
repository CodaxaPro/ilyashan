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
import { formatGermanDate } from "@/lib/quote-form";
import { formatTimeDe } from "@/lib/scheduling/appointment-times";

interface CalendarEventCardProps {
  item: CalendarAppointment;
  compact?: boolean;
  draggable?: boolean;
  dragging?: boolean;
  onOpen: (leadId: string) => void;
  onDragStart?: (item: CalendarAppointment, e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export function CalendarEventCard({
  item,
  compact = false,
  draggable = false,
  dragging = false,
  onOpen,
  onDragStart,
  onDragEnd,
}: CalendarEventCardProps) {
  return (
    <div
      data-testid={`calendar-event-${item.id}`}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(item, e)}
      onDragEnd={onDragEnd}
      className={`rounded-xl border p-2 text-xs cursor-pointer transition-shadow hover:shadow-md ${APPOINTMENT_STATUS_COLORS[item.status]} ${dragging ? "opacity-50" : ""}`}
      onClick={() => onOpen(item.leadId)}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <p className="font-bold truncate">{item.customerName}</p>
        {!compact && item.anfrageNr && (
          <span className="text-[9px] font-mono opacity-70 shrink-0">{item.anfrageNr}</span>
        )}
      </div>

      <p className="text-[10px] opacity-80 truncate">
        {item.city || item.postalCode || "—"}
        {item.windowCount ? ` · ${item.windowCount} Flügel` : ""}
      </p>

      <div className="flex flex-wrap gap-1 mt-1.5">
        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${appointmentRoleColorClass(String(item.role))}`}>
          {appointmentRoleLabelTr(String(item.role))}
        </span>
        {item.kind === "wartung" && (
          <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border-blue-200">
            Wartung
          </span>
        )}
      </div>

      {item.timeSlot && (
        <p className="text-[10px] mt-1 font-medium">
          {TIME_SLOT_LABELS_TR[item.timeSlot] ?? item.timeSlot}
          {item.plannedStartTime ? ` · ${formatTimeDe(item.plannedStartTime)}` : ""}
          {item.staffId ? ` · ${item.staffId}` : ""}
        </p>
      )}

      <p className="text-[10px] mt-1">{APPOINTMENT_STATUS_LABELS_TR[item.status]}</p>

      {!compact && (
        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
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
          {!compact && (
            <span className="text-muted">{formatGermanDate(item.eventDate)}</span>
          )}
        </div>
      )}
    </div>
  );
}
