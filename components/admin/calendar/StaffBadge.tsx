"use client";

import type { StaffMemberSummary } from "@/lib/calendar/staff-lookup";

interface StaffBadgeProps {
  member: StaffMemberSummary | null;
  size?: "sm" | "md";
  showUnassigned?: boolean;
}

export function StaffBadge({ member, size = "sm", showUnassigned = true }: StaffBadgeProps) {
  if (!member) {
    if (!showUnassigned) return null;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-500 font-semibold ${
          size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
        }`}
      >
        Atanmamış
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
      style={{
        backgroundColor: `${member.color}14`,
        borderColor: `${member.color}40`,
        color: member.color,
      }}
      data-testid={`staff-badge-${member.id}`}
    >
      <span
        className={`rounded-full shrink-0 ${size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"}`}
        style={{ backgroundColor: member.color }}
        aria-hidden
      />
      {member.name}
    </span>
  );
}
