import type { CalendarAppointment } from "@/lib/calendar/types";
import { appointmentRoleLabelTr } from "@/lib/calendar/appointment-from-lead";
import { appointmentToGoogleDates } from "@/lib/calendar/ics";

export function buildGoogleCalendarAddUrl(appt: CalendarAppointment): string {
  const { start, end, allDay } = appointmentToGoogleDates(appt);
  const dates = allDay ? `${start}/${end}` : `${start}Z/${end}Z`;

  const location = [appt.city, appt.postalCode].filter(Boolean).join(" ");
  const details = [
    appointmentRoleLabelTr(String(appt.role)),
    appt.anfrageNr ? `ANG: ${appt.anfrageNr}` : null,
    appt.customerPhone ? `Tel: ${appt.customerPhone}` : null,
    appt.notes,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: appt.title,
    dates,
    details,
  });
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function isGoogleCalendarLinkVisible(appt: CalendarAppointment): boolean {
  return appt.status === "bestätigt" || appt.status === "vorgeschlagen";
}
