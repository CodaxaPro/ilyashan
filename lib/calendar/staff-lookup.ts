import type { StaffConfig } from "@/lib/staff/types";
import { getActiveStaff, getStaffMemberById } from "@/lib/staff/config";

export interface StaffMemberSummary {
  id: string;
  name: string;
  color: string;
}

export function toStaffSummaries(config: StaffConfig): StaffMemberSummary[] {
  return getActiveStaff(config).map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
  }));
}

export function buildStaffMap(members: StaffMemberSummary[]): Map<string, StaffMemberSummary> {
  return new Map(members.map((m) => [m.id, m]));
}

export function resolveStaffMember(
  staffId: string | undefined,
  members: StaffMemberSummary[]
): StaffMemberSummary | null {
  if (!staffId) return null;
  const map = buildStaffMap(members);
  return map.get(staffId) ?? null;
}

export function resolveStaffName(
  staffId: string | undefined,
  config: StaffConfig
): string | null {
  const member = getStaffMemberById(config, staffId);
  return member?.name ?? null;
}

export function countAppointmentsByStaff(
  items: { staffId?: string }[],
  members: StaffMemberSummary[]
): Record<string, number> {
  const counts: Record<string, number> = { unassigned: 0 };
  for (const m of members) counts[m.id] = 0;
  for (const item of items) {
    if (!item.staffId) counts.unassigned += 1;
    else if (counts[item.staffId] !== undefined) counts[item.staffId] += 1;
    else counts[item.staffId] = 1;
  }
  return counts;
}
