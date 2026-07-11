import type { LeadAppointment, StoredLead } from "@/lib/leads-store";
import { mapLeadStatusAfterMove } from "@/lib/calendar/appointment-from-lead";
import type { CalendarAppointment } from "@/lib/calendar/types";

export function resolvePreviousAppointmentDate(
  lead: StoredLead,
  appointment: CalendarAppointment
): string | undefined {
  if (appointment.role === "confirmed") return lead.appointment?.confirmedDate;
  if (appointment.role === "proposed") return lead.appointment?.proposedDate;
  return appointment.eventDate;
}

export function buildRescheduleLeadUpdate(
  lead: StoredLead,
  appointment: CalendarAppointment,
  eventDate: string,
  now: Date = new Date()
): { appointment: LeadAppointment; status: StoredLead["status"] } {
  const appointmentPatch: LeadAppointment = { ...lead.appointment };

  if (appointment.role === "confirmed") {
    appointmentPatch.confirmedDate = eventDate;
    appointmentPatch.confirmedAt = now.toISOString();
  } else if (appointment.role === "proposed") {
    appointmentPatch.proposedDate = eventDate;
  }

  const nextStatus = mapLeadStatusAfterMove(lead.status) ?? lead.status;
  return { appointment: appointmentPatch, status: nextStatus };
}
