import type { StaffConfig, StaffMember } from "@/lib/staff/types";

const SETTINGS_KEY = "ilyashan:settings:staff";

export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: "team-1",
    name: "Ekip 1",
    color: "#0369a1",
    active: true,
    workDays: [1, 2, 3, 4, 5, 6],
    maxJobsPerDay: 4,
    maxJobsPerSlot: 2,
  },
  {
    id: "team-2",
    name: "Ekip 2",
    color: "#059669",
    active: true,
    workDays: [1, 2, 3, 4, 5, 6],
    maxJobsPerDay: 4,
    maxJobsPerSlot: 2,
  },
];

export const DEFAULT_STAFF_CONFIG: StaffConfig = {
  members: DEFAULT_STAFF_MEMBERS.map((m) => ({ ...m })),
  autoAssign: true,
  teamMaxJobsPerDay: 6,
  teamMaxJobsPerSlot: 3,
};

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function sanitizeMember(raw: Partial<StaffMember> | undefined, fallback: StaffMember): StaffMember {
  const workDays =
    Array.isArray(raw?.workDays) && raw.workDays.length > 0
      ? raw.workDays.filter((d) => d >= 1 && d <= 6)
      : fallback.workDays;
  return {
    id: typeof raw?.id === "string" && raw.id.trim() ? raw.id.trim() : fallback.id,
    name: typeof raw?.name === "string" && raw.name.trim() ? raw.name.trim() : fallback.name,
    color: typeof raw?.color === "string" && raw.color.trim() ? raw.color.trim() : fallback.color,
    active: raw?.active !== false,
    workDays,
    maxJobsPerDay: clampInt(raw?.maxJobsPerDay, 1, 12, fallback.maxJobsPerDay),
    maxJobsPerSlot: clampInt(raw?.maxJobsPerSlot, 1, 6, fallback.maxJobsPerSlot),
  };
}

export function sanitizeStaffConfig(raw: Partial<StaffConfig> | null | undefined): StaffConfig {
  const d = DEFAULT_STAFF_CONFIG;
  const incoming = raw?.members ?? [];
  const members =
    incoming.length > 0
      ? incoming.map((m, i) => sanitizeMember(m, d.members[i] ?? d.members[0]))
      : d.members.map((m) => ({ ...m }));

  return {
    members,
    autoAssign: raw?.autoAssign !== false,
    teamMaxJobsPerDay: clampInt(raw?.teamMaxJobsPerDay, 1, 20, d.teamMaxJobsPerDay),
    teamMaxJobsPerSlot: clampInt(raw?.teamMaxJobsPerSlot, 1, 10, d.teamMaxJobsPerSlot),
    updatedAt: raw?.updatedAt,
  };
}

export function isStaffConfigStoreConfigured(): boolean {
  return isKvConfigured();
}

export async function getStaffConfig(): Promise<StaffConfig> {
  if (!isKvConfigured()) return sanitizeStaffConfig(undefined);
  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<Partial<StaffConfig>>(SETTINGS_KEY);
    return sanitizeStaffConfig(stored ?? undefined);
  } catch (error) {
    console.error("[staff-config] get failed:", error);
    return sanitizeStaffConfig(undefined);
  }
}

export async function setStaffConfig(patch: Partial<StaffConfig>): Promise<StaffConfig> {
  const current = await getStaffConfig();
  const next = sanitizeStaffConfig({
    ...current,
    ...patch,
    members: patch.members ?? current.members,
    updatedAt: new Date().toISOString(),
  });
  if (!isKvConfigured()) return next;
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(SETTINGS_KEY, next);
    return next;
  } catch (error) {
    console.error("[staff-config] set failed:", error);
    throw error;
  }
}

export function getStaffMemberById(config: StaffConfig, staffId: string | undefined): StaffMember | null {
  if (!staffId) return null;
  return config.members.find((m) => m.id === staffId && m.active) ?? null;
}

export function getActiveStaff(config: StaffConfig): StaffMember[] {
  return config.members.filter((m) => m.active);
}
