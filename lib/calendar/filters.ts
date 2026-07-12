import type {
  AppointmentKind,
  AppointmentRole,
  AppointmentStatus,
  CalendarAppointment,
} from "@/lib/calendar/types";

export type CalendarViewMode = "week" | "month" | "agenda";
export type WeekLayoutMode = "days" | "team";

export interface CalendarFilters {
  search: string;
  status: AppointmentStatus | "all";
  kind: AppointmentKind | "all";
  role: AppointmentRole | "all" | "actionable";
  staffId: string | "all" | "unassigned";
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  search: "",
  status: "all",
  kind: "all",
  role: "actionable",
  staffId: "all",
};

export function isPreferredRole(role: string): boolean {
  return role.startsWith("preferred-");
}

function matchesCalendarFilters(
  item: CalendarAppointment,
  filters: CalendarFilters,
  options?: { includeStatus?: boolean; staffNames?: Record<string, string> }
): boolean {
  const includeStatus = options?.includeStatus ?? true;
  const q = filters.search.trim().toLowerCase();

  if (includeStatus && filters.status !== "all" && item.status !== filters.status) return false;
  if (filters.kind !== "all" && item.kind !== filters.kind) return false;

  if (filters.role === "actionable") {
    if (isPreferredRole(item.role) && item.status !== "bestätigt") return false;
  } else if (filters.role !== "all" && item.role !== filters.role) {
    return false;
  }

  if (filters.staffId === "unassigned") {
    if (item.staffId) return false;
  } else if (filters.staffId !== "all" && item.staffId !== filters.staffId) {
    return false;
  }

  if (!q) return true;

  const staffName = item.staffId ? options?.staffNames?.[item.staffId] : undefined;
  const haystack = [
    item.customerName,
    item.city,
    item.postalCode,
    item.anfrageNr,
    item.title,
    item.customerPhone,
    item.customerEmail,
    item.staffId,
    staffName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function filterCalendarAppointments(
  items: CalendarAppointment[],
  filters: CalendarFilters,
  options?: { staffNames?: Record<string, string> }
): CalendarAppointment[] {
  return items.filter((item) => matchesCalendarFilters(item, filters, options));
}

export function countAppointmentsByStatus(
  items: CalendarAppointment[],
  filters: CalendarFilters,
  options?: { staffNames?: Record<string, string> }
): Record<AppointmentStatus, number> {
  const base = items.filter((item) =>
    matchesCalendarFilters(item, filters, { includeStatus: false, staffNames: options?.staffNames })
  );
  return {
    vorgeschlagen: base.filter((i) => i.status === "vorgeschlagen").length,
    bestätigt: base.filter((i) => i.status === "bestätigt").length,
    erledigt: base.filter((i) => i.status === "erledigt").length,
    storniert: base.filter((i) => i.status === "storniert").length,
  };
}

export function parseCalendarFilters(searchParams: URLSearchParams): CalendarFilters {
  const status = searchParams.get("status") as CalendarFilters["status"] | null;
  const kind = searchParams.get("kind") as CalendarFilters["kind"] | null;
  const role = searchParams.get("role") as CalendarFilters["role"] | null;

  const staffId = searchParams.get("staffId");

  return {
    search: searchParams.get("search") ?? "",
    staffId:
      staffId === "unassigned" || (staffId && staffId !== "all") ? staffId : "all",
    status:
      status === "vorgeschlagen" ||
      status === "bestätigt" ||
      status === "erledigt" ||
      status === "storniert"
        ? status
        : "all",
    kind: kind === "single" || kind === "wartung" ? kind : "all",
    role:
      role === "confirmed" ||
      role === "proposed" ||
      role === "preferred-0" ||
      role === "preferred-1" ||
      role === "preferred-2" ||
      role === "all" ||
      role === "actionable"
        ? role
        : "actionable",
  };
}
