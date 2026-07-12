import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { filterCalendarAppointments, parseCalendarFilters } from "@/lib/calendar/filters";
import { getStaffConfig } from "@/lib/staff/config";
import { toStaffSummaries } from "@/lib/calendar/staff-lookup";
import { groupUpcomingAppointments, buildUpcomingSummary } from "@/lib/calendar/upcoming";
import { resolveUpcomingFetchRange } from "@/lib/calendar/query-range";
import { fetchCalendarAppointments } from "@/lib/calendar/calendar-service";
import { sortAppointments } from "@/lib/calendar/sort";
import { toIsoDate } from "@/lib/calendar/week-range";

async function requireAdmin() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin yapılandırılmamış." }, { status: 503 });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const today = toIsoDate(new Date());
  const { from, to } = resolveUpcomingFetchRange(today);
  const days = Number(searchParams.get("days") ?? "14");
  const cappedDays = Math.min(Math.max(days, 1), 30);

  const { items, storage } = await fetchCalendarAppointments(from, to);
  const filters = parseCalendarFilters(searchParams);
  const staffMembers = toStaffSummaries(await getStaffConfig());
  const staffNames = Object.fromEntries(staffMembers.map((m) => [m.id, m.name]));
  const filtered = sortAppointments(
    filterCalendarAppointments(items, filters, { staffNames })
  );
  const summary = buildUpcomingSummary(filtered, today);
  const groups = groupUpcomingAppointments(filtered, today, false).map((group) => ({
    ...group,
    items: group.items.slice(0, group.bucket === "week" ? 20 : 10),
  }));

  const agendaEnd = searchParams.get("agendaTo") ?? toIsoDate(new Date(Date.now() + cappedDays * 86400000));
  const agendaItems = filtered.filter((item) => item.eventDate >= today && item.eventDate <= agendaEnd);

  return NextResponse.json({
    today,
    summary,
    groups,
    agendaItems: agendaItems.slice(0, 50),
    storage,
    range: { from, to },
  });
}
