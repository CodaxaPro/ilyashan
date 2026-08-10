import type { LeadSource, LeadStatus, StoredLead } from "@/lib/leads-store";

export interface LeadListFilters {
  query: string;
  status: LeadStatus | "all";
  source: LeadSource | "all";
  /** When false (default), archived leads are hidden. */
  includeArchived: boolean;
}

export const EMPTY_LEAD_LIST_FILTERS: LeadListFilters = {
  query: "",
  status: "all",
  source: "all",
  includeArchived: false,
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

/** Haystack fields used for admin lead search. */
export function leadSearchHaystack(lead: StoredLead): string {
  const quote = lead.quote;
  const parts = [
    lead.name,
    lead.phone,
    lead.email,
    lead.anfrageNr,
    lead.summary,
    lead.id,
    lead.adminNotes,
    quote?.postalCode,
    quote?.city,
    quote?.firstName,
    quote?.lastName,
    quote?.street,
  ];
  return normalize(parts.filter(Boolean).join(" "));
}

export function leadMatchesQuery(lead: StoredLead, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;

  const haystack = leadSearchHaystack(lead);
  if (haystack.includes(q)) return true;

  const qDigits = digitsOnly(q);
  if (qDigits.length >= 3) {
    const phoneDigits = digitsOnly(lead.phone ?? "");
    if (phoneDigits.includes(qDigits)) return true;
  }

  return false;
}

export function filterLeads(leads: StoredLead[], filters: LeadListFilters): StoredLead[] {
  const status = filters.status;
  const source = filters.source;

  return leads.filter((lead) => {
    if (!filters.includeArchived && lead.archivedAt) return false;
    if (status !== "all" && (lead.status ?? "neu") !== status) return false;
    if (source !== "all" && lead.source !== source) return false;
    return leadMatchesQuery(lead, filters.query);
  });
}

export function countActiveLeadFilters(filters: LeadListFilters): number {
  let n = 0;
  if (filters.query.trim()) n += 1;
  if (filters.status !== "all") n += 1;
  if (filters.source !== "all") n += 1;
  if (filters.includeArchived) n += 1;
  return n;
}
