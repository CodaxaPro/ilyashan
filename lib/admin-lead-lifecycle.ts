import type { StoredLead } from "@/lib/leads-store";

export interface LeadDeletePolicy {
  /** Hard delete allowed at all. */
  allowed: boolean;
  /** Needs explicit forceConfirm (e.g. confirmed appointment). */
  requiresForce: boolean;
  reasonDe: string;
}

/** Safety rules for permanent lead deletion — no side effects. */
export function getLeadDeletePolicy(lead: Pick<StoredLead, "status" | "appointment">): LeadDeletePolicy {
  const status = lead.status ?? "neu";
  if (status === "termin_bestaetigt" || lead.appointment?.confirmedDate) {
    return {
      allowed: true,
      requiresForce: true,
      reasonDe:
        "Bu lead’de onaylı termin var. Kalıcı silmek için ikinci onayı kullanın (arşiv tercih edilir).",
    };
  }
  return {
    allowed: true,
    requiresForce: false,
    reasonDe: "Lead kalıcı olarak silinecek. Bu işlem geri alınamaz.",
  };
}

export function isLeadArchived(lead: Pick<StoredLead, "archivedAt">): boolean {
  return Boolean(lead.archivedAt);
}
