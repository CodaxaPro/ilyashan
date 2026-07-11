import { NextResponse } from "next/server";
import { fetchCalendarAppointments } from "@/lib/calendar/calendar-service";
import { buildIcsCalendar } from "@/lib/calendar/ics";
import { calendarUidHost, verifyCalendarFeedToken } from "@/lib/calendar/feed-config";
import { addDaysIso, toIsoDate } from "@/lib/calendar/week-range";
import { sortAppointments } from "@/lib/calendar/sort";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!verifyCalendarFeedToken(token)) {
    return NextResponse.json({ error: "Geçersiz veya eksik token." }, { status: 401 });
  }

  const today = toIsoDate(new Date());
  const from = searchParams.get("from") ?? today;
  const to = searchParams.get("to") ?? addDaysIso(today, 90);

  const { items } = await fetchCalendarAppointments(from, to);
  const active = sortAppointments(
    items.filter((item) => item.status === "bestätigt" || item.status === "vorgeschlagen")
  );

  const ics = buildIcsCalendar(active, {
    calendarName: "Ilyashan Fensterreinigung",
    uidHost: calendarUidHost(),
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
