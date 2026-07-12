import type { LeadAppointment, LeadTimeSlot } from "@/lib/leads-store";
import { estimateJobHours } from "@/lib/scheduling/job-duration";

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export interface AppointmentTimePlan {
  preferredStartTime?: string;
  plannedStartTime?: string;
  estimatedDurationHours?: number;
  plannedEndTime?: string;
}

export function normalizeTimeInput(value: string | undefined | null): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const match = trimmed.match(TIME_RE);
  if (!match) return undefined;
  const hours = String(Number.parseInt(match[1], 10)).padStart(2, "0");
  const minutes = match[2];
  return `${hours}:${minutes}`;
}

export function computePlannedEndTime(startTime: string, durationHours: number): string | undefined {
  const start = normalizeTimeInput(startTime);
  if (!start || !Number.isFinite(durationHours) || durationHours <= 0) return undefined;
  const [h, m] = start.split(":").map(Number);
  const totalMinutes = h * 60 + m + Math.round(durationHours * 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function formatTimeDe(time: string | undefined): string | undefined {
  const normalized = normalizeTimeInput(time);
  if (!normalized) return undefined;
  return `${normalized} Uhr`;
}

export function formatDurationDe(hours: number | undefined): string | undefined {
  if (hours === undefined || !Number.isFinite(hours) || hours <= 0) return undefined;
  const label = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",");
  return `ca. ${label} Stunden`;
}

export function suggestDefaultStartForSlot(timeSlot: LeadTimeSlot | undefined): string | undefined {
  switch (timeSlot) {
    case "vormittag":
      return "09:00";
    case "nachmittag":
      return "13:00";
    default:
      return undefined;
  }
}

export function resolveAppointmentTimePlan(
  appointment: LeadAppointment | undefined,
  windowCount?: number
): AppointmentTimePlan {
  const preferredStartTime = normalizeTimeInput(appointment?.preferredStartTime);
  const plannedStartTime = normalizeTimeInput(appointment?.plannedStartTime);
  const estimatedDurationHours =
    appointment?.estimatedDurationHours ??
    (windowCount && windowCount > 0 ? estimateJobHours(windowCount) : undefined);

  const plannedEndTime =
    plannedStartTime && estimatedDurationHours
      ? computePlannedEndTime(plannedStartTime, estimatedDurationHours)
      : undefined;

  return {
    preferredStartTime,
    plannedStartTime,
    estimatedDurationHours,
    plannedEndTime,
  };
}

export function buildArrivalLinesDe(
  dateLabel: string,
  plan: AppointmentTimePlan,
  options?: { includePreferredNote?: boolean }
): string[] {
  const lines = [`Datum: ${dateLabel}`];

  if (plan.plannedStartTime) {
    lines.push(`Ankunft: gegen ${formatTimeDe(plan.plannedStartTime)}`);
    if (plan.estimatedDurationHours) {
      lines.push(`Voraussichtliche Dauer: ${formatDurationDe(plan.estimatedDurationHours)}`);
      if (plan.plannedEndTime) {
        lines.push(`Voraussichtliches Ende: ca. ${formatTimeDe(plan.plannedEndTime)}`);
      }
    }
  } else if (plan.preferredStartTime && options?.includePreferredNote) {
    lines.push(`Ihre Wunsch-Uhrzeit (unverbindlich): ca. ${formatTimeDe(plan.preferredStartTime)}`);
    lines.push(
      "Die genaue Ankunftszeit bestätigen wir nach der Einsatzplanung."
    );
  }

  return lines;
}

export function buildArrivalHtmlDe(
  dateLabel: string,
  plan: AppointmentTimePlan,
  options?: { includePreferredNote?: boolean }
): string {
  const parts = [`<strong>Termin:</strong> ${dateLabel}`];

  if (plan.plannedStartTime) {
    parts.push(`<strong>Ankunft:</strong> gegen ${formatTimeDe(plan.plannedStartTime)}`);
    if (plan.estimatedDurationHours) {
      parts.push(`<strong>Voraussichtliche Dauer:</strong> ${formatDurationDe(plan.estimatedDurationHours)}`);
      if (plan.plannedEndTime) {
        parts.push(`<strong>Voraussichtliches Ende:</strong> ca. ${formatTimeDe(plan.plannedEndTime)}`);
      }
    }
  } else if (plan.preferredStartTime && options?.includePreferredNote) {
    parts.push(
      `<strong>Ihre Wunsch-Uhrzeit (unverbindlich):</strong> ca. ${formatTimeDe(plan.preferredStartTime)}`
    );
    parts.push(
      "Die genaue Ankunftszeit bestätigen wir nach der Einsatzplanung."
    );
  }

  return parts.join("<br>");
}

export function formatSchedulePreviewDe(dateIso: string | undefined, plan: AppointmentTimePlan): string {
  if (!dateIso) return "–";
  const dateLabel = dateIso.split("-").reverse().join(".");
  if (!plan.plannedStartTime) return dateLabel;
  const duration = plan.estimatedDurationHours
    ? ` · ${formatDurationDe(plan.estimatedDurationHours)}`
    : "";
  return `${dateLabel} · gegen ${formatTimeDe(plan.plannedStartTime)}${duration}`;
}
