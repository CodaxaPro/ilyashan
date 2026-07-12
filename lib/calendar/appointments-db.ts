import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { StoredLead } from "@/lib/leads-store";
import { deriveAppointmentsFromLead, withStableIds } from "@/lib/calendar/appointment-from-lead";
import type {
  CalendarAppointment,
  CalendarAppointmentRow,
  AppointmentRole,
} from "@/lib/calendar/types";

export function isAppointmentsDbConfigured(): boolean {
  return isSupabaseConfigured();
}

function rowToAppointment(row: CalendarAppointmentRow): CalendarAppointment {
  return {
    id: row.id,
    leadId: row.lead_id,
    role: row.role as AppointmentRole,
    anfrageNr: row.anfrage_nr ?? undefined,
    kind: row.kind as CalendarAppointment["kind"],
    status: row.status as CalendarAppointment["status"],
    eventDate: row.event_date,
    timeSlot: (row.time_slot as CalendarAppointment["timeSlot"]) ?? undefined,
    customerName: row.customer_name,
    customerEmail: row.customer_email ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    postalCode: row.postal_code ?? undefined,
    city: row.city ?? undefined,
    title: row.title,
    notes: row.notes ?? undefined,
    leadStatus: (row.lead_status as CalendarAppointment["leadStatus"]) ?? undefined,
    source: (row.source as CalendarAppointment["source"]) ?? undefined,
    windowCount: row.window_count ?? undefined,
    staffId: row.staff_id ?? undefined,
    plannedStartTime: row.planned_start_time ?? undefined,
    estimatedDurationHours: row.estimated_duration_hours ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function appointmentToRow(item: Omit<CalendarAppointment, "id" | "createdAt" | "updatedAt">) {
  return {
    lead_id: item.leadId,
    role: item.role,
    anfrage_nr: item.anfrageNr ?? null,
    kind: item.kind,
    status: item.status,
    event_date: item.eventDate,
    time_slot: item.timeSlot ?? null,
    customer_name: item.customerName,
    customer_email: item.customerEmail ?? null,
    customer_phone: item.customerPhone ?? null,
    postal_code: item.postalCode ?? null,
    city: item.city ?? null,
    title: item.title,
    notes: item.notes ?? null,
    lead_status: item.leadStatus ?? null,
    source: item.source ?? null,
    window_count: item.windowCount ?? null,
    staff_id: item.staffId ?? null,
    planned_start_time: item.plannedStartTime ?? null,
    estimated_duration_hours: item.estimatedDurationHours ?? null,
  };
}

export async function listAppointmentsInRange(
  from: string,
  to: string
): Promise<CalendarAppointment[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .gte("event_date", from)
    .lte("event_date", to)
    .neq("status", "storniert")
    .order("event_date", { ascending: true });

  if (error) {
    console.error("[appointments-db] list failed:", error.message);
    return null;
  }

  return (data as CalendarAppointmentRow[]).map(rowToAppointment);
}

export async function syncLeadAppointments(lead: StoredLead): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const derived = deriveAppointmentsFromLead(lead);

  if (lead.status === "abgelehnt" || derived.length === 0) {
    const { error: deleteError } = await supabase.from("appointments").delete().eq("lead_id", lead.id);
    if (deleteError) {
      console.error("[appointments-db] delete failed:", deleteError.message);
      return false;
    }
    return true;
  }

  const rows = derived.map(appointmentToRow);
  const { error } = await supabase.from("appointments").upsert(rows, { onConflict: "lead_id,role" });

  if (error) {
    console.error("[appointments-db] upsert failed:", error.message);
    return false;
  }

  const keepRoles = derived.map((d) => d.role);
  const { data: existing } = await supabase.from("appointments").select("role").eq("lead_id", lead.id);

  const stale =
    (existing as { role: string }[] | null)?.filter((row) => !keepRoles.includes(row.role as AppointmentRole)) ??
    [];

  for (const row of stale) {
    await supabase.from("appointments").delete().eq("lead_id", lead.id).eq("role", row.role);
  }

  return true;
}

export async function updateAppointmentEventDate(
  id: string,
  eventDate: string
): Promise<CalendarAppointment | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("appointments")
    .update({ event_date: eventDate })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[appointments-db] update date failed:", error?.message);
    return null;
  }

  return rowToAppointment(data as CalendarAppointmentRow);
}

export async function getAppointmentById(id: string): Promise<CalendarAppointment | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToAppointment(data as CalendarAppointmentRow);
}

export function listAppointmentsFromLeadsFallback(
  leads: StoredLead[],
  from: string,
  to: string
): CalendarAppointment[] {
  return withStableIds(
    leads
      .flatMap(deriveAppointmentsFromLead)
      .filter((item) => item.eventDate >= from && item.eventDate <= to && item.status !== "storniert")
  );
}