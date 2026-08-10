"use client";

import type { LeadStatus, StoredLead } from "@/lib/leads-store";
import { STATUS_LABELS, LeadStatusBadge } from "@/components/admin/AdminLeadDetailPanel";

const BOARD_COLUMNS: LeadStatus[] = [
  "neu",
  "kontaktiert",
  "termin_vorgeschlagen",
  "termin_bestaetigt",
  "abgeschlossen",
  "abgelehnt",
];

interface AdminLeadKanbanProps {
  leads: StoredLead[];
  onOpenLead: (lead: StoredLead) => void;
}

export function AdminLeadKanban({ leads, onOpenLead }: AdminLeadKanbanProps) {
  return (
    <div
      className="overflow-x-auto pb-2 -mx-1 px-1"
      data-testid="admin-leads-kanban"
    >
      <div className="flex gap-3 min-w-max">
        {BOARD_COLUMNS.map((status) => {
          const columnLeads = leads.filter((l) => (l.status ?? "neu") === status);
          return (
            <section
              key={status}
              className="w-64 shrink-0 rounded-2xl border border-border bg-slate-50/80"
              data-testid={`kanban-col-${status}`}
            >
              <header className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-foreground truncate">
                  {STATUS_LABELS[status]}
                </h3>
                <span className="text-[11px] font-semibold text-muted tabular-nums">
                  {columnLeads.length}
                </span>
              </header>
              <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                {columnLeads.length === 0 ? (
                  <p className="text-[11px] text-muted px-1 py-3 text-center">Boş</p>
                ) : (
                  columnLeads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => onOpenLead(lead)}
                      className="w-full text-left rounded-xl border border-border bg-white p-3 shadow-sm hover:border-primary/30 hover:shadow transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground line-clamp-2">
                          {lead.name}
                        </p>
                        {lead.archivedAt && (
                          <span className="shrink-0 text-[9px] font-bold uppercase text-slate-500">
                            arşiv
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 mb-2">{lead.summary}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <LeadStatusBadge status={lead.status} />
                        <span className="text-[10px] text-muted">{lead.source}</span>
                        {lead.anfrageNr && (
                          <span className="text-[10px] text-muted truncate">{lead.anfrageNr}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
