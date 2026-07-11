import { NextResponse } from "next/server";
import { loadSchedulingAvailability } from "@/lib/scheduling/availability-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const excludeLeadId = searchParams.get("excludeLeadId") ?? undefined;

  if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    return NextResponse.json({ error: "Ungültiges from-Datum." }, { status: 400 });
  }
  if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "Ungültiges to-Datum." }, { status: 400 });
  }

  const { availability } = await loadSchedulingAvailability({ from, to, excludeLeadId });
  return NextResponse.json({ availability });
}
