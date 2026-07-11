import type { AppointmentRole } from "./types";

export const LOCAL_APPOINTMENT_ROLES: AppointmentRole[] = [
  "confirmed",
  "proposed",
  "preferred-0",
  "preferred-1",
  "preferred-2",
];

/** Parse KV-fallback ids: `local-{leadId}-{role}`. */
export function parseLocalAppointmentId(
  id: string
): { leadId: string; role: AppointmentRole } | null {
  if (!id.startsWith("local-")) return null;
  const rest = id.slice("local-".length);
  for (const role of LOCAL_APPOINTMENT_ROLES) {
    const suffix = `-${role}`;
    if (rest.endsWith(suffix)) {
      return { leadId: rest.slice(0, -suffix.length), role };
    }
  }
  return null;
}

export function isLocalAppointmentId(id: string): boolean {
  return parseLocalAppointmentId(id) !== null;
}
