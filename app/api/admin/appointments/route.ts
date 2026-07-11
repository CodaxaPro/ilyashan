import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { getWeekRange } from "@/lib/calendar/week-range";
import {
  fetchCalendarAppointments,
  syncAllLeadsToCalendar,
} from "@/lib/calendar/calendar-service";
import { isAppointmentsDbConfigured } from "@/lib/calendar/appointments-db";

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
  const weekStart = searchParams.get("weekStart");
  const range = weekStart ? getWeekRange(new Date(weekStart + "T12:00:00")) : getWeekRange();

  const { items, storage } = await fetchCalendarAppointments(range.start, range.end);

  return NextResponse.json({
    appointments: items,
    week: range,
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
