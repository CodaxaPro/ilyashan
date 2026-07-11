import type {
  AppointmentKind,
  AppointmentRole,
  AppointmentStatus,
  CalendarAppointment,
} from "@/lib/calendar/types";

export type CalendarViewMode = "week" | "month" | "agenda";

export interface CalendarFilters {
  search: string;
  status: AppointmentStatus | "all";
  kind: AppointmentKind | "all";
  role: AppointmentRole | "all" | "actionable";
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  search: "",
  status: "all",
  kind: "all",
  role: "actionable",
};

export function isPreferredRole(role: string): boolean {
  return role.startsWith("preferred-");
}

export function filterCalendarAppointments(
  items: CalendarAppointment[],
  filters: CalendarFilters
): CalendarAppointment[] {
  const q = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.kind !== "all" && item.kind !== filters.kind) return false;

    if (filters.role === "actionable") {
      if (isPreferredRole(item.role) && item.status !== "bestätigt") return false;
    } else if (filters.role !== "all" && item.role !== filters.role) {
      return false;
    }

    if (!q) return true;

    const haystack = [
      item.customerName,
      item.city,
      item.postalCode,
      item.anfrageNr,
      item.title,
      item.customerPhone,
      item.customerEmail,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function parseCalendarFilters(searchParams: URLSearchParams): CalendarFilters {
  const status = searchParams.get("status") as CalendarFilters["status"] | null;
  const kind = searchParams.get("kind") as CalendarFilters["kind"] | null;
  const role = searchParams.get("role") as CalendarFilters["role"] | null;

  return {
    search: searchParams.get("search") ?? "",
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
