import type { CalendarAppointment, CalendarTimeSlot } from "@/lib/calendar/types";
import { appointmentRoleLabelTr } from "@/lib/calendar/appointment-from-lead";
import { TIME_SLOT_LABELS_TR } from "@/lib/calendar/appointment-from-lead";

const SLOT_HOURS: Record<Exclude<CalendarTimeSlot, "ganztags">, { start: number; end: number }> = {
  vormittag: { start: 9, end: 12 },
  nachmittag: { start: 13, end: 17 },
  flexibel: { start: 9, end: 17 },
};

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  const max = 73;
  if (line.length <= max) return line;
  const parts: string[] = [line.slice(0, max)];
  let rest = line.slice(max);
  while (rest.length > max - 1) {
    parts.push(" " + rest.slice(0, max - 1));
    rest = rest.slice(max - 1);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

function formatUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatLocalDateTime(isoDate: string, hour: number, minute = 0): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hour - 1, minute)); // Europe/Berlin ~ UTC+1 (winter)
  return formatUtcStamp(dt);
}

function isAllDaySlot(slot?: CalendarTimeSlot): boolean {
  return !slot || slot === "ganztags" || slot === "flexibel";
}

export function appointmentToGoogleDates(appt: CalendarAppointment): { start: string; end: string; allDay: boolean } {
  if (isAllDaySlot(appt.timeSlot)) {
    const [y, m, d] = appt.eventDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const endIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    return {
      start: appt.eventDate.replace(/-/g, ""),
      end: endIso.replace(/-/g, ""),
      allDay: true,
    };
  }

  const hours = SLOT_HOURS[appt.timeSlot as Exclude<CalendarTimeSlot, "ganztags">] ?? SLOT_HOURS.flexibel;
  return {
    start: formatLocalDateTime(appt.eventDate, hours.start).replace(/Z$/, ""),
    end: formatLocalDateTime(appt.eventDate, hours.end).replace(/Z$/, ""),
    allDay: false,
  };
}

export function buildIcsEvent(appt: CalendarAppointment, uidHost: string): string {
  const uid = `${appt.id}@${uidHost}`;
  const stamp = formatUtcStamp(new Date());
  const { start, end, allDay } = appointmentToGoogleDates(appt);

  const location = [appt.city, appt.postalCode].filter(Boolean).join(" ");
  const description = [
    appointmentRoleLabelTr(String(appt.role)),
    appt.anfrageNr ? `ANG: ${appt.anfrageNr}` : null,
    appt.customerPhone ? `Tel: ${appt.customerPhone}` : null,
    appt.timeSlot ? TIME_SLOT_LABELS_TR[appt.timeSlot] : null,
    appt.notes,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}Z`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}Z`,
    foldLine(`SUMMARY:${escapeIcs(appt.title)}`),
    location ? foldLine(`LOCATION:${escapeIcs(location)}`) : null,
    description ? foldLine(`DESCRIPTION:${escapeIcs(description)}`) : null,
    `STATUS:${appt.status === "storniert" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
  ].filter(Boolean) as string[];

  return lines.join("\r\n");
}

export function buildIcsCalendar(
  appointments: CalendarAppointment[],
  options: { calendarName: string; uidHost: string; prodId?: string }
): string {
  const events = appointments
    .filter((a) => a.status !== "storniert")
    .map((a) => buildIcsEvent(a, options.uidHost))
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ilyashan//Calendar//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(options.calendarName)}`,
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
