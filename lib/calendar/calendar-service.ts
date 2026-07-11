import type { StoredLead } from "@/lib/leads-store";
import { listLeads } from "@/lib/leads-store";
import {
  isAppointmentsDbConfigured,
  listAppointmentsFromLeadsFallback,
  listAppointmentsInRange,
  syncLeadAppointments,
} from "@/lib/calendar/appointments-db";
import type { CalendarAppointment } from "@/lib/calendar/types";

export async function fetchCalendarAppointments(
  from: string,
  to: string
): Promise<{ items: CalendarAppointment[]; storage: "supabase" | "kv-fallback" }> {
  if (isAppointmentsDbConfigured()) {
    const items = await listAppointmentsInRange(from, to);
    if (items) return { items, storage: "supabase" };
  }

  const leads = await listLeads(200);
  return {
    items: listAppointmentsFromLeadsFallback(leads, from, to),
    storage: "kv-fallback",
  };
}

export async function syncLeadToCalendar(lead: StoredLead): Promise<void> {
  if (!isAppointmentsDbConfigured()) return;
  await syncLeadAppointments(lead);
}

export async function syncAllLeadsToCalendar(): Promise<{ synced: number; failed: number }> {
  const leads = await listLeads(200);
  let synced = 0;
  let failed = 0;

  if (!isAppointmentsDbConfigured()) {
    return { synced: 0, failed: leads.length };
  }

  for (const lead of leads) {
    const ok = await syncLeadAppointments(lead);
    if (ok) synced += 1;
    else failed += 1;
  }

  return { synced, failed };
}
