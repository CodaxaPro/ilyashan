import { parseIsoDate, toIsoDate, weekdayLabelTr } from "@/lib/calendar/week-range";

export interface MonthRange {
  year: number;
  month: number;
  start: string;
  end: string;
  days: string[];
  weeks: MonthWeekRow[];
}

export interface MonthWeekRow {
  weekStart: string;
  cells: (string | null)[];
}

const MONTH_NAMES_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

/** Work days (Mon–Sat) within a calendar month. */
export function getMonthRange(year: number, month: number): MonthRange {
  if (month < 1 || month > 12) throw new Error("month must be 1–12");
  const lastDay = new Date(year, month, 0).getDate();
  const days: string[] = [];

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() !== 0) days.push(toIsoDate(date));
  }

  return {
    year,
    month,
    start: days[0] ?? toIsoDate(new Date(year, month - 1, 1)),
    end: days[days.length - 1] ?? toIsoDate(new Date(year, month - 1, lastDay)),
    days,
    weeks: groupDaysIntoWorkWeekRows(days),
  };
}

export function groupDaysIntoWorkWeekRows(days: string[]): MonthWeekRow[] {
  if (days.length === 0) return [];

  const weeks: MonthWeekRow[] = [];
  let current: string[] = [];

  for (const iso of days) {
    const dow = parseIsoDate(iso).getDay();
    if (dow === 1 && current.length > 0) {
      weeks.push(padWeekRow(current));
      current = [];
    }
    current.push(iso);
  }
  if (current.length > 0) weeks.push(padWeekRow(current));

  return weeks;
}

function padWeekRow(days: string[]): MonthWeekRow {
  const cells: (string | null)[] = [null, null, null, null, null, null];
  for (const iso of days) {
    const dow = parseIsoDate(iso).getDay();
    const idx = dow === 0 ? 6 : dow - 1;
    cells[idx] = iso;
  }
  const first = days[0];
  return { weekStart: first, cells };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function parseMonthParam(value: string | null): { year: number; month: number } | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES_TR[month - 1]} ${year}`;
}

export function monthOptions(centerYear: number, span = 2): { year: number; month: number; label: string }[] {
  const options: { year: number; month: number; label: string }[] = [];
  for (let y = centerYear - span; y <= centerYear + span; y++) {
    for (let m = 1; m <= 12; m++) {
      options.push({ year: y, month: m, label: formatMonthLabel(y, m) });
    }
  }
  return options;
}

export function isToday(iso: string, today = toIsoDate(new Date())): boolean {
  return iso === today;
}

export function dayHeaderLabel(iso: string): string {
  return `${weekdayLabelTr(iso)} ${parseIsoDate(iso).getDate()}`;
}
