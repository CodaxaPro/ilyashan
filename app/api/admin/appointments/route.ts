import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import {
  filterCalendarAppointments,
  countAppointmentsByStatus,
  parseCalendarFilters,
} from "@/lib/calendar/filters";
import { formatMonthLabel } from "@/lib/calendar/month-range";
import { resolveCalendarQueryRange } from "@/lib/calendar/query-range";
import {
  fetchCalendarAppointments,
  syncAllLeadsToCalendar,
} from "@/lib/calendar/calendar-service";
import { isAppointmentsDbConfigured } from "@/lib/calendar/appointments-db";
import { buildUpcomingSummary } from "@/lib/calendar/upcoming";
import { sortAppointments, sortAppointmentsForDay } from "@/lib/calendar/sort";
import { buildRangeStats } from "@/lib/calendar/stats";
import { getWeekRange, toIsoDate } from "@/lib/calendar/week-range";
import {
  buildCalendarFeedUrl,
  getCalendarIcsToken,
  isCalendarFeedConfigured,
} from "@/lib/calendar/feed-config";
import { getStaffConfig } from "@/lib/staff/config";
import { toStaffSummaries } from "@/lib/calendar/staff-lookup";

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
  const range = resolveCalendarQueryRange(searchParams);
  const filters = parseCalendarFilters(searchParams);
  const today = toIsoDate(new Date());

  const { items, storage } = await fetchCalendarAppointments(range.from, range.to);
  const staffConfig = await getStaffConfig();
  const staffMembers = toStaffSummaries(staffConfig);
  const staffNames = Object.fromEntries(staffMembers.map((m) => [m.id, m.name]));
  const filterOptions = { staffNames };

  const statusCounts = countAppointmentsByStatus(items, filters, filterOptions);
  const filtered = sortAppointments(filterCalendarAppointments(items, filters, filterOptions));
  const byDay: Record<string, ReturnType<typeof sortAppointmentsForDay>> = {};

  const dayKeys =
    range.view === "agenda"
      ? [...new Set(filtered.map((i) => i.eventDate))].sort()
      : range.days;

  for (const day of dayKeys) {
    byDay[day] = sortAppointmentsForDay(filtered.filter((i) => i.eventDate === day));
  }

  const stats = buildRangeStats(filtered, dayKeys.length ? dayKeys : [...new Set(filtered.map((i) => i.eventDate))].sort());
  const upcoming = buildUpcomingSummary(filtered, today);

  const origin = new URL(request.url).origin;
  const icsToken = getCalendarIcsToken();
  const icsFeedUrl = icsToken ? buildCalendarFeedUrl(origin, icsToken) : null;

  return NextResponse.json({
    appointments: filtered,
    byDay,
    range,
    filters,
    statusCounts,
    stats,
    upcoming,
    today,
    view: range.view,
    week: range.week ?? (range.view === "week" ? getWeekRange() : undefined),
    month:
      range.month ??
      (range.view === "month"
        ? {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            label: formatMonthLabel(new Date().getFullYear(), new Date().getMonth() + 1),
          }
        : undefined),
    storage,
    dbConfigured: isAppointmentsDbConfigured(),
    icsFeed: {
      configured: isCalendarFeedConfigured(),
      subscribeUrl: icsFeedUrl,
    },
    staffMembers,
  });
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  if (!isAppointmentsDbConfigured()) {
    return NextResponse.json(
      { error: "Supabase yapılandırılmamış. appointments tablosu gerekli." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "sync-all") {
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }

  const result = await syncAllLeadsToCalendar();
  return NextResponse.json({ success: true, ...result });
}
