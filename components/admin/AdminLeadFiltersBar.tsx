"use client";

import type { LeadSource, LeadStatus } from "@/lib/leads-store";
import {
  countActiveLeadFilters,
  EMPTY_LEAD_LIST_FILTERS,
  type LeadListFilters,
} from "@/lib/admin-lead-filters";
import { STATUS_LABELS } from "@/components/admin/AdminLeadDetailPanel";

const SOURCE_LABELS: Record<LeadSource | "all", string> = {
  all: "Tüm kaynaklar",
  quote: "quote",
  concierge: "concierge",
  contact: "contact",
};

interface AdminLeadFiltersBarProps {
  filters: LeadListFilters;
  onChange: (next: LeadListFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export function AdminLeadFiltersBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: AdminLeadFiltersBarProps) {
  const active = countActiveLeadFilters(filters);
  const statusOptions = ["all", ...(Object.keys(STATUS_LABELS) as LeadStatus[])] as const;

  return (
    <div
      className="mb-4 rounded-2xl border border-border bg-white p-4 space-y-3 shadow-sm"
      data-testid="admin-lead-filters"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Ara & filtrele</p>
          <p className="text-xs text-muted mt-0.5">
            {filteredCount === totalCount
              ? `${totalCount} lead`
              : `${filteredCount} / ${totalCount} lead gösteriliyor`}
            {active > 0 ? ` · ${active} filtre aktif` : ""}
          </p>
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_LEAD_LIST_FILTERS)}
            className="text-xs font-semibold text-primary hover:underline"
            data-testid="admin-lead-filters-reset"
          >
            Filtreleri temizle
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.4fr,1fr,1fr]">
        <label className="block text-xs font-semibold text-muted">
          Arama
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="İsim, telefon, e-posta, Anfrage-Nr., PLZ…"
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground font-normal"
            data-testid="admin-lead-search"
          />
        </label>

        <label className="block text-xs font-semibold text-muted">
          Durum
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as LeadListFilters["status"] })
            }
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground font-normal bg-white"
            data-testid="admin-lead-status-filter"
          >
            <option value="all">Tüm durumlar</option>
            {statusOptions
              .filter((s) => s !== "all")
              .map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-muted">
          Kaynak
          <select
            value={filters.source}
            onChange={(e) =>
              onChange({ ...filters, source: e.target.value as LeadListFilters["source"] })
            }
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground font-normal bg-white"
            data-testid="admin-lead-source-filter"
          >
            {(Object.keys(SOURCE_LABELS) as (LeadSource | "all")[]).map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-xs text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={filters.includeArchived}
          onChange={(e) => onChange({ ...filters, includeArchived: e.target.checked })}
          className="rounded border-border text-primary focus:ring-primary/30"
          data-testid="admin-lead-include-archived"
        />
        Arşivlenenleri de göster
      </label>
    </div>
  );
}
