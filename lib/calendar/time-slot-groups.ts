import type { CalendarAppointment, CalendarTimeSlot } from "@/lib/calendar/types";

export interface TimeSlotSection {
  key: string;
  label: string;
  hint?: string;
}

export const TIME_SLOT_SECTIONS: TimeSlotSection[] = [
  { key: "vormittag", label: "Vormittag", hint: "08:00–12:00" },
  { key: "nachmittag", label: "Nachmittag", hint: "13:00–17:00" },
  { key: "flexibel", label: "Flexibel" },
  { key: "ganztags", label: "Ganztags" },
];

export function timeSlotSectionKey(timeSlot: CalendarTimeSlot | undefined): string {
  if (!timeSlot) return "_none";
  return TIME_SLOT_SECTIONS.some((s) => s.key === timeSlot) ? timeSlot : "_other";
}

export function groupAppointmentsByTimeSlot(
  items: CalendarAppointment[]
): { section: TimeSlotSection | null; items: CalendarAppointment[] }[] {
  const buckets = new Map<string, CalendarAppointment[]>();
  for (const item of items) {
    const key = timeSlotSectionKey(item.timeSlot);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  const ordered: { section: TimeSlotSection | null; items: CalendarAppointment[] }[] = [];
  for (const section of TIME_SLOT_SECTIONS) {
    const list = buckets.get(section.key);
    if (list?.length) ordered.push({ section, items: list });
    buckets.delete(section.key);
  }
  const other = buckets.get("_other");
  if (other?.length) {
    ordered.push({ section: { key: "_other", label: "Diğer" }, items: other });
    buckets.delete("_other");
  }
  const none = buckets.get("_none");
  if (none?.length) {
    ordered.push({ section: { key: "_none", label: "Saat belirtilmedi" }, items: none });
  }
  return ordered;
}
