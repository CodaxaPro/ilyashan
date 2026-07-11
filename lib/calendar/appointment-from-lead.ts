import type { StoredLead } from "@/lib/leads-store";
import type { QuoteFormData } from "@/lib/quote-form";
import { initialQuoteFormData } from "@/lib/quote-form";
import type {
  AppointmentKind,
  AppointmentRole,
  AppointmentStatus,
  CalendarAppointment,
  CalendarTimeSlot,
} from "@/lib/calendar/types";

export const APPOINTMENT_STATUS_LABELS_TR: Record<AppointmentStatus, string> = {
  vorgeschlagen: "Önerildi",
  bestätigt: "Onaylandı",
  erledigt: "Tamamlandı",
  storniert: "İptal",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  vorgeschlagen: "bg-amber-100 text-amber-900 border-amber-200",
  bestätigt: "bg-emerald-100 text-emerald-900 border-emerald-200",
  erledigt: "bg-slate-100 text-slate-700 border-slate-200",
  storniert: "bg-red-100 text-red-800 border-red-200",
};

export const TIME_SLOT_LABELS_TR: Record<CalendarTimeSlot, string> = {
  vormittag: "Sabah",
  nachmittag: "Öğleden sonra",
  flexibel: "Esnek",
  ganztags: "Tüm gün",
};

export const APPOINTMENT_ROLE_LABELS_TR: Record<AppointmentRole, string> = {
  confirmed: "Onaylı termin",
  proposed: "Önerilen termin",
  "preferred-0": "Wunsch 1",
  "preferred-1": "Wunsch 2",
  "preferred-2": "Wunsch 3",
};

export const APPOINTMENT_ROLE_COLORS: Record<AppointmentRole, string> = {
  confirmed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  proposed: "bg-sky-50 text-sky-800 border-sky-200",
  "preferred-0": "bg-violet-50 text-violet-800 border-violet-200",
  "preferred-1": "bg-violet-50 text-violet-700 border-violet-200",
  "preferred-2": "bg-violet-50 text-violet-600 border-violet-200",
};

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

function resolveKind(quote: QuoteFormData | null): AppointmentKind {
  return quote?.services.includes("wartung") ? "wartung" : "single";
}

function resolveTimeSlot(quote: QuoteFormData | null): CalendarTimeSlot | undefined {
  if (!quote) return undefined;
  if (quote.wartungPreferredTimeSlot) return quote.wartungPreferredTimeSlot;
  return "flexibel";
}

function statusForLead(lead: StoredLead, base: AppointmentStatus): AppointmentStatus {
  if (lead.status === "abgelehnt") return "storniert";
  if (lead.status === "abgeschlossen" && base === "bestätigt") return "erledigt";
  return base;
}

function buildTitle(lead: StoredLead, quote: QuoteFormData | null): string {
  const fluegel = quote?.windowCount ? `${quote.windowCount} Flügel` : "Fensterreinigung";
  const ort = quote?.city || quote?.postalCode || "";
  return ort ? `${lead.name} · ${fluegel} · ${ort}` : `${lead.name} · ${fluegel}`;
}

function baseFields(lead: StoredLead, quote: QuoteFormData | null) {
  return {
    leadId: lead.id,
    anfrageNr: lead.anfrageNr,
    kind: resolveKind(quote),
    timeSlot: resolveTimeSlot(quote),
    customerName: lead.name,
    customerEmail: lead.email,
    customerPhone: lead.phone,
    postalCode: quote?.postalCode,
    city: quote?.city,
    title: buildTitle(lead, quote),
    notes: lead.appointment?.note,
    leadStatus: lead.status,
    source: lead.source,
    windowCount: quote?.windowCount,
  };
}

function makeDerived(
  lead: StoredLead,
  quote: QuoteFormData | null,
  role: AppointmentRole,
  eventDate: string,
  status: AppointmentStatus
): Omit<CalendarAppointment, "id"> {
  return {
    ...baseFields(lead, quote),
    role,
    status: statusForLead(lead, status),
    eventDate,
  };
}

/** Pure: derive calendar rows from a lead (no DB). */
export function deriveAppointmentsFromLead(lead: StoredLead): Omit<CalendarAppointment, "id">[] {
  if (lead.source !== "quote") return [];

  const quote = mergeQuote(lead.quote);
  if (!quote) return [];

  if (lead.status === "abgelehnt") return [];

  const items: Omit<CalendarAppointment, "id">[] = [];
  const confirmed = lead.appointment?.confirmedDate;
  const proposed = lead.appointment?.proposedDate;

  if (confirmed) {
    items.push(makeDerived(lead, quote, "confirmed", confirmed, "bestätigt"));
  }

  if (proposed && proposed !== confirmed) {
    items.push(makeDerived(lead, quote, "proposed", proposed, "vorgeschlagen"));
  }

  if (!confirmed && quote.preferredDates?.length) {
    quote.preferredDates.slice(0, 3).forEach((iso, index) => {
      const role = `preferred-${index}` as AppointmentRole;
      if (!items.some((item) => item.eventDate === iso && item.role === role)) {
        items.push(makeDerived(lead, quote, role, iso, "vorgeschlagen"));
      }
    });
  }

  return items;
}

export function deriveAppointmentsFromLeads(leads: StoredLead[]): Omit<CalendarAppointment, "id">[] {
  return leads.flatMap(deriveAppointmentsFromLead);
}

export function stableAppointmentId(leadId: string, role: AppointmentRole): string {
  return `local-${leadId}-${role}`;
}

export function withStableIds(
  items: Omit<CalendarAppointment, "id">[]
): CalendarAppointment[] {
  return items.map((item) => ({
    ...item,
    id: stableAppointmentId(item.leadId, item.role),
  }));
}

export function mapLeadStatusAfterMove(status?: string): "termin_bestaetigt" | undefined {
  if (status === "abgelehnt" || status === "abgeschlossen") return undefined;
  return "termin_bestaetigt";
}

export function canRescheduleAppointment(item: CalendarAppointment): boolean {
  return item.status === "bestätigt" || item.status === "vorgeschlagen";
}
