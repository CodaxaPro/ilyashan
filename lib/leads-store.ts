import type { ConciergeSession } from "@/lib/concierge/types";
import type { QuoteFormData } from "@/lib/quote-form";

export type LeadSource = "quote" | "concierge" | "contact";

export type LeadStatus =
  | "neu"
  | "kontaktiert"
  | "termin_vorgeschlagen"
  | "termin_bestaetigt"
  | "abgeschlossen"
  | "abgelehnt";

export interface LeadAppointment {
  proposedDate?: string;
  confirmedDate?: string;
  confirmedAt?: string;
  note?: string;
}

export interface StoredLead {
  id: string;
  source: LeadSource;
  createdAt: string;
  name: string;
  phone?: string;
  email?: string;
  anfrageNr?: string;
  hot?: boolean;
  summary: string;
  photoCount: number;
  status?: LeadStatus;
  adminNotes?: string;
  appointment?: LeadAppointment;
  quote?: Partial<QuoteFormData>;
  session?: Partial<ConciergeSession>;
}

const LEADS_KEY = "ilyashan:leads";
const MAX_LEADS = 200;

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function isLeadsStoreConfigured(): boolean {
  return isKvConfigured();
}

export async function saveLead(lead: StoredLead): Promise<void> {
  if (!isKvConfigured()) {
    console.info("[leads-store] KV not configured, skipping persist:", lead.id);
    return;
  }

  try {
    const { kv } = await import("@vercel/kv");
    await kv.lpush(LEADS_KEY, lead);
    await kv.ltrim(LEADS_KEY, 0, MAX_LEADS - 1);
  } catch (error) {
    console.error("[leads-store] save failed:", error);
  }
}

export async function listLeads(limit = 50): Promise<StoredLead[]> {
  if (!isKvConfigured()) return [];

  try {
    const { kv } = await import("@vercel/kv");
    const items = await kv.lrange<StoredLead>(LEADS_KEY, 0, limit - 1);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error("[leads-store] list failed:", error);
    return [];
  }
}

export async function getLead(id: string): Promise<StoredLead | null> {
  if (!isKvConfigured()) return null;

  try {
    const { kv } = await import("@vercel/kv");
    const items = await kv.lrange<StoredLead>(LEADS_KEY, 0, MAX_LEADS - 1);
    if (!Array.isArray(items)) return null;
    return items.find((lead) => lead.id === id) ?? null;
  } catch (error) {
    console.error("[leads-store] get failed:", error);
    return null;
  }
}

export async function updateLead(
  id: string,
  patch: Partial<StoredLead>
): Promise<StoredLead | null> {
  if (!isKvConfigured()) return null;

  try {
    const { kv } = await import("@vercel/kv");
    const items = await kv.lrange<StoredLead>(LEADS_KEY, 0, MAX_LEADS - 1);
    if (!Array.isArray(items)) return null;

    const index = items.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const updated: StoredLead = {
      ...items[index],
      ...patch,
      id: items[index].id,
      createdAt: items[index].createdAt,
    };

    await kv.lset(LEADS_KEY, index, updated);
    return updated;
  } catch (error) {
    console.error("[leads-store] update failed:", error);
    return null;
  }
}

export function createLeadId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
