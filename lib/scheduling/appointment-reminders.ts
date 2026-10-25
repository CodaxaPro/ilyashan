import type { LeadAppointment, StoredLead } from "@/lib/leads-store";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import { berlinTomorrowIso } from "@/lib/scheduling/berlin-date";
import {
  canCustomerBookOnline,
  isBueroLead,
  isTreppenhausLead,
} from "@/lib/lead-product";

export type ReminderWave = "eve" | "morning";

export interface ReminderCandidate {
  lead: StoredLead;
  quote: QuoteFormData | null;
  confirmedDate: string;
  wave: ReminderWave;
}

export interface ReminderEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function needsReminderForDate(
  appointment: LeadAppointment | undefined,
  confirmedDate: string,
  wave: ReminderWave = "eve"
): boolean {
  if (wave === "morning") {
    const morning = appointment?.morningReminderEmail;
    if (!morning) return true;
    return morning.forDate !== confirmedDate;
  }
  if (!appointment?.reminderEmail) return true;
  return appointment.reminderEmail.forDate !== confirmedDate;
}

export function isReminderEligibleLead(
  lead: StoredLead,
  targetDate: string,
  wave: ReminderWave = "eve"
): ReminderEligibilityResult {
  if (lead.source !== "quote") {
    return { eligible: false, reason: "not_quote" };
  }
  if (!lead.email?.trim()) {
    return { eligible: false, reason: "no_email" };
  }
  if (lead.status === "abgelehnt" || lead.status === "abgeschlossen") {
    return { eligible: false, reason: "terminal_status" };
  }

  const confirmedDate = lead.appointment?.confirmedDate;
  if (!confirmedDate || confirmedDate !== targetDate) {
    return { eligible: false, reason: "wrong_date" };
  }
  if (!needsReminderForDate(lead.appointment, confirmedDate, wave)) {
    return { eligible: false, reason: "already_sent" };
  }

  if (!canCustomerBookOnline(lead)) {
    return { eligible: false, reason: "incomplete_quote" };
  }

  return { eligible: true };
}

export function findReminderCandidates(
  leads: StoredLead[],
  targetDate: string = berlinTomorrowIso(),
  wave: ReminderWave = "eve"
): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = [];

  for (const lead of leads) {
    const check = isReminderEligibleLead(lead, targetDate, wave);
    if (!check.eligible) continue;
    if (!lead.appointment?.confirmedDate) continue;
    const quote = mergeQuote(lead.quote);
    if (!isBueroLead(lead) && !isTreppenhausLead(lead) && !quote) continue;
    candidates.push({
      lead,
      quote,
      confirmedDate: lead.appointment.confirmedDate,
      wave,
    });
  }

  return candidates;
}

function mergeQuote(raw: Partial<QuoteFormData> | undefined): QuoteFormData | null {
  if (!raw?.windowCount) return null;
  return { ...initialQuoteFormData, ...raw };
}

export function buildReminderAppointmentPatch(
  appointment: LeadAppointment | undefined,
  confirmedDate: string,
  wave: ReminderWave = "eve",
  sentAt: string = new Date().toISOString()
): LeadAppointment {
  if (wave === "morning") {
    return {
      ...appointment,
      morningReminderEmail: {
        sentAt,
        forDate: confirmedDate,
      },
    };
  }
  return {
    ...appointment,
    reminderEmail: {
      sentAt,
      forDate: confirmedDate,
    },
  };
}
