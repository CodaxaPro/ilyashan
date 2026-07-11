"use client";

import type { CalendarFilters } from "@/lib/calendar/filters";

interface CalendarFiltersBarProps {
  filters: CalendarFilters;
  onChange: (filters: CalendarFilters) => void;
}

export function CalendarFiltersBar({ filters, onChange }: CalendarFiltersBarProps) {
  return (
    <div
      className="flex flex-wrap items-end gap-3"
      data-testid="calendar-filters"
    >
      <label className="flex flex-col gap-1 min-w-[180px] flex-1">
        <span className="text-xs font-semibold text-muted">Ara</span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="İsim, PLZ, ANG-Nr…"
          className="px-3 py-2 rounded-xl border border-border text-sm"
          data-testid="calendar-filter-search"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">Durum</span>
        <select
          value={filters.status}
          onChange={(e) =>
            onChange({ ...filters, status: e.target.value as CalendarFilters["status"] })
          }
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white"
          data-testid="calendar-filter-status"
        >
          <option value="all">Tümü</option>
          <option value="bestätigt">Onaylandı</option>
          <option value="vorgeschlagen">Önerildi</option>
          <option value="erledigt">Tamamlandı</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">Tür</span>
        <select
          value={filters.kind}
          onChange={(e) => onChange({ ...filters, kind: e.target.value as CalendarFilters["kind"] })}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white"
          data-testid="calendar-filter-kind"
        >
          <option value="all">Tümü</option>
          <option value="single">Tek sefer</option>
          <option value="wartung">Wartung</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">Rol</span>
        <select
          value={filters.role}
          onChange={(e) => onChange({ ...filters, role: e.target.value as CalendarFilters["role"] })}
          className="px-3 py-2 rounded-xl border border-border text-sm bg-white"
          data-testid="calendar-filter-role"
        >
          <option value="actionable">Operasyon (onaylı/önerilen)</option>
          <option value="all">Tüm roller</option>
          <option value="confirmed">Onaylı</option>
          <option value="proposed">Önerilen</option>
          <option value="preferred-0">Wunsch 1</option>
        </select>
      </label>
    </div>
  );
}
