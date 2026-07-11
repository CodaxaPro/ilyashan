import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { fetchCalendarAppointments } from "@/lib/calendar/calendar-service";
import { filterCalendarAppointments, parseCalendarFilters } from "@/lib/calendar/filters";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { calendarUidHost } from "@/lib/calendar/feed-config";
import { resolveCalendarQueryRange } from "@/lib/calendar/query-range";
import { sortAppointments } from "@/lib/calendar/sort";

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

  const { items } = await fetchCalendarAppointments(range.from, range.to);
  const filtered = sortAppointments(filterCalendarAppointments(items, filters));

  const ics = buildIcsCalendar(filtered, {
    calendarName: "Ilyashan Admin Termine",
    uidHost: calendarUidHost(),
  });

  const filename = `ilyashan-termine-${range.from}-${range.to}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
