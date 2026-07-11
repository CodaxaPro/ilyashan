"use client";

import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS_TR,
  APPOINTMENT_STATUS_ORDER,
} from "@/lib/calendar/appointment-from-lead";
import type { CalendarFilters } from "@/lib/calendar/filters";
import type { AppointmentStatus } from "@/lib/calendar/types";

interface CalendarStatusChipsProps {
  counts: Record<AppointmentStatus, number>;
  active: CalendarFilters["status"];
  onChange: (status: CalendarFilters["status"]) => void;
}

export function CalendarStatusChips({ counts, active, onChange }: CalendarStatusChipsProps) {
  const total = APPOINTMENT_STATUS_ORDER.reduce((sum, key) => sum + (counts[key] ?? 0), 0);

  function handleClick(status: CalendarFilters["status"]) {
    onChange(active === status ? "all" : status);
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="calendar-status-chips">
      <StatusChip
        label="Tümü"
        count={total}
        active={active === "all"}
        className="bg-white text-foreground border-border"
        onClick={() => onChange("all")}
        testId="calendar-status-all"
      />

      {APPOINTMENT_STATUS_ORDER.map((status) => (
        <StatusChip
          key={status}
          label={APPOINTMENT_STATUS_LABELS_TR[status]}
          count={counts[status] ?? 0}
          active={active === status}
          className={APPOINTMENT_STATUS_COLORS[status]}
          onClick={() => handleClick(status)}
          testId={`calendar-status-${status}`}
        />
      ))}
    </div>
  );
}

function StatusChip({
  label,
  count,
  active,
  className,
  onClick,
  testId,
}: {
  label: string;
  count: number;
  active: boolean;
  className: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-shadow hover:shadow-sm ${className} ${
        active ? "ring-2 ring-primary ring-offset-1 shadow-sm" : ""
      }`}
    >
      <span>{label}</span>
      <span
        className={`min-w-5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
          active ? "bg-primary text-white" : "bg-black/10"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
