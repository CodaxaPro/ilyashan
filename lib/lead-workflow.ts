import type {
  LeadAppointment,
  LeadEmailAction,
  LeadEmailNotification,
  LeadStatus,
  StoredLead,
} from "@/lib/leads-store";

export type LeadEmailActionInput = LeadEmailAction | "none";

export interface LeadPatchInput {
  status?: LeadStatus;
  adminNotes?: string;
  proposedDate?: string;
  confirmedDate?: string;
  appointmentNote?: string;
  emailAction?: LeadEmailActionInput;
}

export interface ResolvedLeadUpdate {
  status: LeadStatus;
  appointment: LeadAppointment;
}

export function mergeLeadAppointment(
  previous: LeadAppointment | undefined,
  input: LeadPatchInput
): LeadAppointment {
  const appointment: LeadAppointment = { ...previous };

  if (input.proposedDate !== undefined) {
    appointment.proposedDate = input.proposedDate || undefined;
  }
  if (input.confirmedDate !== undefined) {
    appointment.confirmedDate = input.confirmedDate || undefined;
    appointment.confirmedAt = input.confirmedDate ? new Date().toISOString() : undefined;
  }
  if (input.appointmentNote !== undefined) {
    appointment.note = input.appointmentNote || undefined;
  }

  return appointment;
}

export function resolveLeadUpdate(lead: StoredLead, input: LeadPatchInput): ResolvedLeadUpdate {
  const appointment = mergeLeadAppointment(lead.appointment, input);
  let status = input.status ?? lead.status ?? "neu";
  const emailAction = input.emailAction ?? "none";

  switch (emailAction) {
    case "confirm":
    case "update":
      status = "termin_bestaetigt";
      break;
    case "propose":
      status = "termin_vorgeschlagen";
      break;
    case "reject":
      status = "abgelehnt";
      appointment.confirmedDate = undefined;
      appointment.confirmedAt = undefined;
      break;
    case "none":
    default:
      if (status === "abgelehnt") {
        appointment.confirmedDate = undefined;
        appointment.confirmedAt = undefined;
      }
      break;
  }

  return { status, appointment };
}

export function inferEmailAction(
  lead: StoredLead,
  input: LeadPatchInput,
  resolved: ResolvedLeadUpdate
): LeadEmailAction | null {
  const explicit = input.emailAction;
  if (explicit && explicit !== "none") return explicit;

  if (resolved.status === "abgelehnt") return "reject";
  if (resolved.appointment.confirmedDate) {
    const previousDate = lead.appointment?.confirmedDate;
    if (previousDate && previousDate !== resolved.appointment.confirmedDate) {
      return "update";
    }
    if (!previousDate) return "confirm";
  }
  if (resolved.status === "termin_vorgeschlagen" && resolved.appointment.proposedDate) {
    return "propose";
  }
  return null;
}

export function resolveEmailActionForSave(
  lead: StoredLead,
  input: LeadPatchInput
): LeadEmailAction | null {
  const action = input.emailAction;
  if (!action || action === "none") return null;

  if (action === "confirm" || action === "update") {
    if (!input.confirmedDate) return null;
  }
  if (action === "propose" && !input.proposedDate) {
    return null;
  }

  if (action === "update") {
    const hadConfirmed = Boolean(lead.appointment?.confirmedDate);
    if (!hadConfirmed) return "confirm";
  }

  return action;
}

export function buildEmailNotificationRecord(
  action: LeadEmailAction,
  status: LeadStatus,
  appointment: LeadAppointment
): LeadEmailNotification {
  return {
    action,
    sentAt: new Date().toISOString(),
    status,
    confirmedDate: appointment.confirmedDate,
    proposedDate: appointment.proposedDate,
  };
}

export const LEAD_EMAIL_ACTION_LABELS_TR: Record<LeadEmailAction, string> = {
  confirm: "Termin onaylandı — onay e-postası gönderildi.",
  update: "Termin güncellendi — güncelleme e-postası gönderildi.",
  propose: "Termin önerildi — teklif e-postası gönderildi.",
  reject: "Talep reddedildi — bilgilendirme e-postası gönderildi.",
};

export const LEAD_STATUS_LABELS_TR: Record<LeadStatus, string> = {
  neu: "Yeni",
  kontaktiert: "İletişim kuruldu",
  termin_vorgeschlagen: "Termin önerildi",
  termin_bestaetigt: "Termin onaylandı",
  abgeschlossen: "Tamamlandı",
  abgelehnt: "Reddedildi",
};

export function getPrimaryEmailActionLabel(
  lead: StoredLead,
  status: LeadStatus,
  confirmedDate: string,
  proposedDate: string
): { action: LeadEmailAction; label: string } | null {
  if (!lead.email?.trim()) return null;

  if (status === "abgelehnt") {
    return { action: "reject", label: "Reddet + müşteriye bildir" };
  }
  if (confirmedDate) {
    const hadConfirmed = Boolean(lead.appointment?.confirmedDate);
    const dateChanged = hadConfirmed && lead.appointment?.confirmedDate !== confirmedDate;
    if (hadConfirmed && dateChanged) {
      return { action: "update", label: "Termin güncelle + e-posta gönder" };
    }
    return { action: "confirm", label: "Termin onayla + e-posta gönder" };
  }
  if (proposedDate && (status === "termin_vorgeschlagen" || !confirmedDate)) {
    return { action: "propose", label: "Termin öner + e-posta gönder" };
  }
  return null;
}
