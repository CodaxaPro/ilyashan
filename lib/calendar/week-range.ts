const WEEKDAY_LABELS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-based week containing `anchor` (defaults to today). */
export function getWeekRange(anchor: Date = new Date()): { start: string; end: string; days: string[] } {
  const date = new Date(anchor);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() + i);
    days.push(toIsoDate(d));
  }

  return { start: days[0], end: days[5], days };
}

export function shiftWeek(isoStart: string, deltaWeeks: number): string {
  const start = parseIsoDate(isoStart);
  start.setDate(start.getDate() + deltaWeeks * 7);
  return getWeekRange(start).start;
}

export function formatWeekLabel(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const fmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function weekdayLabelTr(iso: string): string {
  const d = parseIsoDate(iso);
  const idx = d.getDay();
  const mapped = idx === 0 ? 6 : idx - 1;
  return WEEKDAY_LABELS_TR[mapped];
}

export function isDateInRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

export function groupAppointmentsByDate<T extends { eventDate: string }>(
  items: T[],
  days: string[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = Object.fromEntries(days.map((d) => [d, []]));
  for (const item of items) {
    if (grouped[item.eventDate]) grouped[item.eventDate].push(item);
  }
  for (const day of days) {
    grouped[day].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }
  return grouped;
}
