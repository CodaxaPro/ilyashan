import type { LeadAppointment, LeadStatus, StoredLead } from "@/lib/leads-store";
import type { StaffConfig } from "@/lib/staff/types";
import {
  type BookableTimeSlot,
  buildOccupancyFromLeads,
  isSlotAvailable,
  pickStaffForSlot,
  resolveLeadTimeSlot,
} from "@/lib/scheduling/slot-engine";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import { normalizeTimeInput } from "@/lib/scheduling/appointment-times";

export type BookingAction = "confirm_proposed" | "pick_slot";

export interface BookingInput {
  action: BookingAction;
  date?: string;
  timeSlot?: BookableTimeSlot;
  preferredStartTime?: string;
}

export interface BookingResult {
  ok: boolean;
  error?: string;
  status?: LeadStatus;
  appointment?: LeadAppointment;
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

function isoDateValid(iso: string | undefined): iso is string {
  return Boolean(iso && /^\d{4}-\d{2}-\d{2}$/.test(iso));
}

export function applyCustomerBooking(
  lead: StoredLead,
  staffConfig: StaffConfig,
  allLeads: StoredLead[],
  input: BookingInput,
  now: Date = new Date()
): BookingResult {
  if (lead.source !== "quote") {
    return { ok: false, error: "Diese Anfrage unterstützt keine Online-Terminbuchung." };
  }
  if (lead.status === "abgelehnt" || lead.status === "abgeschlossen") {
    return { ok: false, error: "Für diese Anfrage ist keine Terminbuchung mehr möglich." };
  }

  const quote = mergeQuote(lead.quote);
  if (!quote) return { ok: false, error: "Anfragedaten unvollständig." };

  const occupancy = buildOccupancyFromLeads(allLeads);
  const previous = lead.appointment ?? {};

  if (input.action === "confirm_proposed") {
    const proposed = previous.proposedDate;
    if (!isoDateValid(proposed)) {
      return { ok: false, error: "Es liegt kein Terminvorschlag vor." };
    }
    const timeSlot = (previous.timeSlot as BookableTimeSlot | undefined) ?? resolveLeadTimeSlot(lead, quote);
    const check = isSlotAvailable(staffConfig, occupancy, proposed, timeSlot, {
      excludeLeadId: lead.id,
      staffId: previous.staffId,
    });
    if (!check.available) {
      return { ok: false, error: "Der vorgeschlagene Termin ist leider nicht mehr verfügbar." };
    }

    const staffId =
      previous.staffId ??
      (staffConfig.autoAssign ? pickStaffForSlot(staffConfig, occupancy, proposed, timeSlot) : null) ??
      undefined;

    const appointment: LeadAppointment = {
      ...previous,
      confirmedDate: proposed,
      confirmedAt: now.toISOString(),
      customerBookedAt: now.toISOString(),
      timeSlot,
      staffId,
      proposedDate: undefined,
    };

    return {
      ok: true,
      status: "termin_bestaetigt",
      appointment,
    };
  }

  if (input.action === "pick_slot") {
    if (!isoDateValid(input.date)) {
      return { ok: false, error: "Bitte wählen Sie ein gültiges Datum." };
    }
    const timeSlot = input.timeSlot ?? "flexibel";
    const preferredStartTime = normalizeTimeInput(input.preferredStartTime);
    const check = isSlotAvailable(staffConfig, occupancy, input.date, timeSlot, {
      excludeLeadId: lead.id,
    });
    if (!check.available) {
      return { ok: false, error: "Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen." };
    }

    const staffId =
      (staffConfig.autoAssign ? pickStaffForSlot(staffConfig, occupancy, input.date, timeSlot) : null) ??
      undefined;

    const appointment: LeadAppointment = {
      ...previous,
      confirmedDate: input.date,
      confirmedAt: now.toISOString(),
      customerBookedAt: now.toISOString(),
      timeSlot,
      preferredStartTime: preferredStartTime ?? previous.preferredStartTime,
      staffId,
      proposedDate: undefined,
    };

    return {
      ok: true,
      status: "termin_bestaetigt",
      appointment,
    };
  }

  return { ok: false, error: "Ungültige Buchungsaktion." };
}

export function validateAdminSlotAssignment(
  lead: StoredLead,
  staffConfig: StaffConfig,
  allLeads: StoredLead[],
  date: string,
  timeSlot: BookableTimeSlot,
  staffId?: string
): { ok: boolean; error?: string; staffId?: string } {
  if (!isoDateValid(date)) return { ok: false, error: "Ungültiges Datum." };

  const occupancy = buildOccupancyFromLeads(allLeads);
  const check = isSlotAvailable(staffConfig, occupancy, date, timeSlot, {
    excludeLeadId: lead.id,
    staffId,
  });

  if (!check.available) {
    return { ok: false, error: "Kapazität für diesen Termin ist ausgeschöpft." };
  }

  const resolvedStaff =
    staffId ??
    (staffConfig.autoAssign ? pickStaffForSlot(staffConfig, occupancy, date, timeSlot, staffId) : undefined) ??
    undefined;

  return { ok: true, staffId: resolvedStaff };
}
