import type { CalendarTimeSlot } from "@/lib/calendar/types";
import type { StoredLead } from "@/lib/leads-store";
import type { QuoteFormData } from "@/lib/quote-form";
import { initialQuoteFormData } from "@/lib/quote-form";
import type { StaffConfig, StaffMember } from "@/lib/staff/types";
import { getActiveStaff } from "@/lib/staff/config";
import { parseIsoDate } from "@/lib/calendar/week-range";

export type BookableTimeSlot = "vormittag" | "nachmittag" | "flexibel";

export const BOOKABLE_TIME_SLOTS: BookableTimeSlot[] = ["vormittag", "nachmittag", "flexibel"];

export const TIME_SLOT_LABELS_DE: Record<BookableTimeSlot, string> = {
  vormittag: "Vormittag (ca. 8–12 Uhr)",
  nachmittag: "Nachmittag (ca. 12–17 Uhr)",
  flexibel: "Flexibel (wir melden uns mit Uhrzeit)",
};

export interface ScheduledOccupancy {
  leadId: string;
  eventDate: string;
  timeSlot: BookableTimeSlot;
  staffId?: string;
  role: string;
  windowCount?: number;
}

export interface SlotOption {
  timeSlot: BookableTimeSlot;
  available: boolean;
  remainingCapacity: number;
  suggestedStaffId?: string;
}

export interface DayAvailability {
  date: string;
  weekday: number;
  available: boolean;
  slots: SlotOption[];
  totalRemaining: number;
}

export interface AvailabilityRange {
  from: string;
  to: string;
  days: DayAvailability[];
  staffConfig: Pick<StaffConfig, "autoAssign" | "teamMaxJobsPerDay" | "teamMaxJobsPerSlot">;
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

export function resolveLeadTimeSlot(
  lead: StoredLead,
  quote: QuoteFormData | null
): BookableTimeSlot {
  const fromAppointment = lead.appointment?.timeSlot;
  if (fromAppointment === "vormittag" || fromAppointment === "nachmittag" || fromAppointment === "flexibel") {
    return fromAppointment;
  }
  const wartung = quote?.wartungPreferredTimeSlot;
  if (wartung === "vormittag" || wartung === "nachmittag") return wartung;
  return "flexibel";
}

export function isoWeekday(iso: string): number {
  const day = parseIsoDate(iso).getDay();
  return day === 0 ? 7 : day;
}

export function staffWorksOnDay(staff: StaffMember, iso: string): boolean {
  const wd = isoWeekday(iso);
  return staff.workDays.includes(wd);
}

function normalizeSlot(slot: CalendarTimeSlot | BookableTimeSlot | undefined): BookableTimeSlot {
  if (slot === "vormittag" || slot === "nachmittag") return slot;
  return "flexibel";
}

function slotsMatch(requested: BookableTimeSlot, existing: BookableTimeSlot): boolean {
  if (requested === "flexibel" || existing === "flexibel") return true;
  return requested === existing;
}

function countsTowardOccupancy(role: string): boolean {
  return role === "confirmed" || role === "proposed";
}

export function buildOccupancyFromLeads(leads: StoredLead[]): ScheduledOccupancy[] {
  const items: ScheduledOccupancy[] = [];

  for (const lead of leads) {
    if (lead.source !== "quote" || lead.status === "abgelehnt") continue;
    const quote = mergeQuote(lead.quote);
    if (!quote) continue;

    const timeSlot = resolveLeadTimeSlot(lead, quote);
    const staffId = lead.appointment?.staffId;
    const windowCount = quote.windowCount;

    const confirmed = lead.appointment?.confirmedDate;
    const proposed = lead.appointment?.proposedDate;

    if (confirmed) {
      items.push({
        leadId: lead.id,
        eventDate: confirmed,
        timeSlot,
        staffId,
        role: "confirmed",
        windowCount,
      });
    } else if (proposed) {
      items.push({
        leadId: lead.id,
        eventDate: proposed,
        timeSlot,
        staffId,
        role: "proposed",
        windowCount,
      });
    }
  }

  return items;
}

function filterOccupancy(
  occupancy: ScheduledOccupancy[],
  options?: { excludeLeadId?: string; date?: string }
): ScheduledOccupancy[] {
  return occupancy.filter((item) => {
    if (options?.excludeLeadId && item.leadId === options.excludeLeadId) return false;
    if (options?.date && item.eventDate !== options.date) return false;
    if (!countsTowardOccupancy(item.role)) return false;
    return true;
  });
}

function countStaffDay(occupancy: ScheduledOccupancy[], staffId: string, date: string): number {
  return occupancy.filter((o) => o.staffId === staffId && o.eventDate === date).length;
}

function countStaffSlot(
  occupancy: ScheduledOccupancy[],
  staffId: string,
  date: string,
  slot: BookableTimeSlot
): number {
  return occupancy.filter(
    (o) =>
      o.staffId === staffId &&
      o.eventDate === date &&
      slotsMatch(slot, normalizeSlot(o.timeSlot))
  ).length;
}

function countTeamPoolDay(occupancy: ScheduledOccupancy[], date: string): number {
  return occupancy.filter((o) => !o.staffId && o.eventDate === date).length;
}

function countTeamPoolSlot(
  occupancy: ScheduledOccupancy[],
  date: string,
  slot: BookableTimeSlot
): number {
  return occupancy.filter(
    (o) => !o.staffId && o.eventDate === date && slotsMatch(slot, normalizeSlot(o.timeSlot))
  ).length;
}

export function pickStaffForSlot(
  config: StaffConfig,
  occupancy: ScheduledOccupancy[],
  date: string,
  slot: BookableTimeSlot,
  preferredStaffId?: string
): string | null {
  const active = getActiveStaff(config).filter((s) => staffWorksOnDay(s, date));
  if (active.length === 0) return null;

  if (preferredStaffId) {
    const preferred = active.find((s) => s.id === preferredStaffId);
    if (preferred) {
      const dayLoad = countStaffDay(occupancy, preferred.id, date);
      const slotLoad = countStaffSlot(occupancy, preferred.id, date, slot);
      if (dayLoad < preferred.maxJobsPerDay && slotLoad < preferred.maxJobsPerSlot) {
        return preferred.id;
      }
      return null;
    }
  }

  const teamDay = countTeamPoolDay(occupancy, date);
  const teamSlot = countTeamPoolSlot(occupancy, date, slot);
  const teamDayOk = teamDay < config.teamMaxJobsPerDay;
  const teamSlotOk = teamSlot < config.teamMaxJobsPerSlot;

  const ranked = active
    .map((staff) => ({
      staff,
      dayLoad: countStaffDay(occupancy, staff.id, date),
      slotLoad: countStaffSlot(occupancy, staff.id, date, slot),
    }))
    .filter(
      (c) => c.dayLoad < c.staff.maxJobsPerDay && c.slotLoad < c.staff.maxJobsPerSlot
    )
    .sort((a, b) => a.dayLoad - b.dayLoad || a.slotLoad - b.slotLoad || a.staff.name.localeCompare(b.staff.name));

  if (ranked.length > 0) return ranked[0].staff.id;
  if (teamDayOk && teamSlotOk) return null;
  return null;
}

export function isSlotAvailable(
  config: StaffConfig,
  occupancy: ScheduledOccupancy[],
  date: string,
  slot: BookableTimeSlot,
  options?: { excludeLeadId?: string; staffId?: string }
): { available: boolean; staffId: string | null; remainingCapacity: number } {
  const filtered = filterOccupancy(occupancy, { excludeLeadId: options?.excludeLeadId, date });
  const active = getActiveStaff(config).filter((s) => staffWorksOnDay(s, date));

  if (active.length === 0) {
    return { available: false, staffId: null, remainingCapacity: 0 };
  }

  if (options?.staffId) {
    const staff = active.find((s) => s.id === options.staffId);
    if (!staff) return { available: false, staffId: null, remainingCapacity: 0 };
    const dayRem = staff.maxJobsPerDay - countStaffDay(filtered, staff.id, date);
    const slotRem = staff.maxJobsPerSlot - countStaffSlot(filtered, staff.id, date, slot);
    const remaining = Math.min(dayRem, slotRem);
    return {
      available: remaining > 0,
      staffId: remaining > 0 ? staff.id : null,
      remainingCapacity: Math.max(0, remaining),
    };
  }

  let totalRemaining = 0;
  for (const staff of active) {
    const dayRem = staff.maxJobsPerDay - countStaffDay(filtered, staff.id, date);
    const slotRem = staff.maxJobsPerSlot - countStaffSlot(filtered, staff.id, date, slot);
    totalRemaining += Math.max(0, Math.min(dayRem, slotRem));
  }

  const teamDayRem = config.teamMaxJobsPerDay - countTeamPoolDay(filtered, date);
  const teamSlotRem = config.teamMaxJobsPerSlot - countTeamPoolSlot(filtered, date, slot);
  totalRemaining += Math.max(0, Math.min(teamDayRem, teamSlotRem));

  const staffId = pickStaffForSlot(config, filtered, date, slot);
  const teamAvailable = teamDayRem > 0 && teamSlotRem > 0;
  const staffAvailable = staffId !== null;
  return {
    available: (staffAvailable || teamAvailable) && totalRemaining > 0,
    staffId,
    remainingCapacity: totalRemaining,
  };
}

export function buildDayAvailability(
  config: StaffConfig,
  occupancy: ScheduledOccupancy[],
  date: string,
  options?: { excludeLeadId?: string }
): DayAvailability {
  const slots: SlotOption[] = BOOKABLE_TIME_SLOTS.map((timeSlot) => {
    const check = isSlotAvailable(config, occupancy, date, timeSlot, options);
    return {
      timeSlot,
      available: check.available,
      remainingCapacity: check.remainingCapacity,
      suggestedStaffId: check.staffId ?? undefined,
    };
  });

  const totalRemaining = slots.reduce((sum, s) => sum + s.remainingCapacity, 0);
  return {
    date,
    weekday: isoWeekday(date),
    available: slots.some((s) => s.available),
    slots,
    totalRemaining,
  };
}

export function buildAvailabilityRange(
  config: StaffConfig,
  occupancy: ScheduledOccupancy[],
  from: string,
  to: string,
  options?: { excludeLeadId?: string }
): AvailabilityRange {
  const days: DayAvailability[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(buildDayAvailability(config, occupancy, cursor, options));
    const d = parseIsoDate(cursor);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    cursor = `${y}-${m}-${day}`;
  }

  return {
    from,
    to,
    days,
    staffConfig: {
      autoAssign: config.autoAssign,
      teamMaxJobsPerDay: config.teamMaxJobsPerDay,
      teamMaxJobsPerSlot: config.teamMaxJobsPerSlot,
    },
  };
}

export function enumerateIsoDates(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    const d = parseIsoDate(cursor);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    cursor = `${y}-${m}-${day}`;
  }
  return dates;
}
