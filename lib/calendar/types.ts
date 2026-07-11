import type { LeadSource, LeadStatus } from "@/lib/leads-store";
import type { PreferredTimeSlot } from "@/lib/quote-form";

export type AppointmentKind = "single" | "wartung";

export type AppointmentStatus = "vorgeschlagen" | "bestätigt" | "erledigt" | "storniert";

export type AppointmentRole =
  | "confirmed"
  | "proposed"
  | "preferred-0"
  | "preferred-1"
  | "preferred-2"
  | `wartung-${number}`;

export type CalendarTimeSlot = Exclude<PreferredTimeSlot, ""> | "ganztags";

export interface CalendarAppointment {
  id: string;
  leadId: string;
  role: AppointmentRole | string;
  anfrageNr?: string;
  kind: AppointmentKind;
  status: AppointmentStatus;
  eventDate: string;
  timeSlot?: CalendarTimeSlot;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  postalCode?: string;
  city?: string;
  title: string;
  notes?: string;
  leadStatus?: LeadStatus;
  source?: LeadSource;
  windowCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarAppointmentRow {
  id: string;
  lead_id: string;
  role: string;
  anfrage_nr: string | null;
  kind: string;
  status: string;
  event_date: string;
  time_slot: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  postal_code: string | null;
  city: string | null;
  title: string;
  notes: string | null;
  lead_status: string | null;
  source: string | null;
  window_count: number | null;
  created_at: string;
  updated_at: string;
}
