import type { CalendarAppointment, CalendarTimeSlot } from "@/lib/calendar/types";
import { isWartungSeriesRole } from "@/lib/calendar/wartung-series";

const TIME_SLOT_ORDER: Record<CalendarTimeSlot, number> = {
  vormittag: 0,
  nachmittag: 1,
  flexibel: 2,
  ganztags: 3,
};

function roleOrder(role: string): number {
  if (role === "confirmed") return 0;
  if (role === "proposed") return 1;
  if (role.startsWith("preferred-")) return 2 + Number.parseInt(role.split("-")[1] ?? "0", 10);
  if (isWartungSeriesRole(role)) return 20 + Number.parseInt(role.replace("wartung-", ""), 10);
  return 99;
}

const STATUS_ORDER = {
  bestätigt: 0,
  vorgeschlagen: 1,
  erledigt: 2,
  storniert: 3,
} as const;

export function compareAppointments(a: CalendarAppointment, b: CalendarAppointment): number {
  const dateCmp = a.eventDate.localeCompare(b.eventDate);
  if (dateCmp !== 0) return dateCmp;

  const slotA = a.timeSlot ? TIME_SLOT_ORDER[a.timeSlot] : 99;
  const slotB = b.timeSlot ? TIME_SLOT_ORDER[b.timeSlot] : 99;
  if (slotA !== slotB) return slotA - slotB;

  const roleCmp = roleOrder(String(a.role)) - roleOrder(String(b.role));
  if (roleCmp !== 0) return roleCmp;

  const statusCmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (statusCmp !== 0) return statusCmp;

  return a.customerName.localeCompare(b.customerName, "tr");
}

export function sortAppointments(items: CalendarAppointment[]): CalendarAppointment[] {
  return [...items].sort(compareAppointments);
}

export function sortAppointmentsForDay(items: CalendarAppointment[]): CalendarAppointment[] {
  return sortAppointments(items);
}
