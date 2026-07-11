import type { AppointmentRole } from "./types";
import { isWartungSeriesRole } from "./wartung-series";

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
): { leadId: string; role: AppointmentRole | string } | null {
  if (!id.startsWith("local-")) return null;
  const rest = id.slice("local-".length);

  const fixedRoles = [...LOCAL_APPOINTMENT_ROLES].sort((a, b) => b.length - a.length);
  for (const role of fixedRoles) {
    const suffix = `-${role}`;
    if (rest.endsWith(suffix)) {
      return { leadId: rest.slice(0, -suffix.length), role };
    }
  }

  const wartungMatch = rest.match(/^(.+)-wartung-(\d+)$/);
  if (wartungMatch) {
    return { leadId: wartungMatch[1], role: `wartung-${wartungMatch[2]}` };
  }

  return null;
}

export function isLocalAppointmentId(id: string): boolean {
  return parseLocalAppointmentId(id) !== null;
}

export function isKnownAppointmentRole(role: string): role is AppointmentRole {
  return (
    LOCAL_APPOINTMENT_ROLES.includes(role as AppointmentRole) || isWartungSeriesRole(role)
  );
}
