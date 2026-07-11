import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import {
  filterCalendarAppointments,
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
  const filtered = sortAppointments(filterCalendarAppointments(items, filters));
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

  return NextResponse.json({
    appointments: filtered,
    byDay,
    range,
    filters,
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
