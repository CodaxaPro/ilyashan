import type { LeadAppointment, StoredLead } from "@/lib/leads-store";
import { initialQuoteFormData, type QuoteFormData } from "@/lib/quote-form";
import { berlinTomorrowIso } from "@/lib/scheduling/berlin-date";
import { isBueroLead, isCompleteQuoteLead } from "@/lib/lead-product";

export interface ReminderCandidate {
  lead: StoredLead;
  quote: QuoteFormData | null;
  confirmedDate: string;
}

export interface ReminderEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function needsReminderForDate(
  appointment: LeadAppointment | undefined,
  confirmedDate: string
): boolean {
  if (!appointment?.reminderEmail) return true;
  return appointment.reminderEmail.forDate !== confirmedDate;
}

export function isReminderEligibleLead(
  lead: StoredLead,
  targetDate: string
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
  if (!needsReminderForDate(lead.appointment, confirmedDate)) {
    return { eligible: false, reason: "already_sent" };
  }

  if (!isCompleteQuoteLead(lead)) {
    return { eligible: false, reason: "incomplete_quote" };
  }

  return { eligible: true };
}

export function findReminderCandidates(
  leads: StoredLead[],
  targetDate: string = berlinTomorrowIso()
): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = [];

  for (const lead of leads) {
    const check = isReminderEligibleLead(lead, targetDate);
    if (!check.eligible) continue;
    if (!lead.appointment?.confirmedDate) continue;
    const quote = mergeQuote(lead.quote);
    if (!isBueroLead(lead) && !quote) continue;
    candidates.push({
      lead,
      quote,
      confirmedDate: lead.appointment.confirmedDate,
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
  confirmedDate: string
): LeadAppointment {
  return {
    ...appointment,
    reminderEmail: {
      sentAt: new Date().toISOString(),
      forDate: confirmedDate,
    },
  };
}
