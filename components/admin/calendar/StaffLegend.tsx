"use client";

import type { StaffMemberSummary } from "@/lib/calendar/staff-lookup";
import type { CalendarFilters } from "@/lib/calendar/filters";

interface StaffLegendProps {
  members: StaffMemberSummary[];
  counts: Record<string, number>;
  activeStaffId: CalendarFilters["staffId"];
  onSelect: (staffId: CalendarFilters["staffId"]) => void;
}

export function StaffLegend({ members, counts, activeStaffId, onSelect }: StaffLegendProps) {
  if (members.length === 0) return null;

  const totalAssigned = members.reduce((sum, m) => sum + (counts[m.id] ?? 0), 0);
  const unassigned = counts.unassigned ?? 0;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="calendar-staff-legend"
    >
      <span className="text-xs font-semibold text-muted uppercase tracking-wide mr-1">Ekip</span>

      <StaffChip
        label="Tümü"
        count={totalAssigned + unassigned}
        active={activeStaffId === "all"}
        onClick={() => onSelect("all")}
        testId="staff-filter-all"
      />

      {members.map((member) => (
        <StaffChip
          key={member.id}
          label={member.name}
          count={counts[member.id] ?? 0}
          color={member.color}
          active={activeStaffId === member.id}
          onClick={() => onSelect(member.id)}
          testId={`staff-filter-${member.id}`}
        />
      ))}

      {unassigned > 0 && (
        <StaffChip
          label="Atanmamış"
          count={unassigned}
          active={activeStaffId === "unassigned"}
          onClick={() => onSelect("unassigned")}
          testId="staff-filter-unassigned"
          dashed
        />
      )}
    </div>
  );
}

function StaffChip({
  label,
  count,
  color,
  active,
  onClick,
  testId,
  dashed,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
  testId: string;
  dashed?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? "ring-2 ring-primary/30 shadow-sm"
          : "hover:bg-slate-50"
      } ${dashed ? "border-dashed border-slate-300 text-slate-600" : "border-border text-foreground"}`}
      style={
        color && active
          ? { backgroundColor: `${color}18`, borderColor: `${color}55`, color }
          : color
            ? { borderColor: `${color}30` }
            : undefined
      }
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      )}
      <span>{label}</span>
      <span
        className={`min-w-[1.25rem] text-center rounded-full px-1 text-[10px] ${
          active ? "bg-white/80" : "bg-slate-100 text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
