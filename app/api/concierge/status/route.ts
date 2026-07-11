import { NextResponse } from "next/server";
import { getConciergeSettings } from "@/lib/concierge-settings";

export const runtime = "nodejs";

export async function GET() {
  const settings = await getConciergeSettings();
  return NextResponse.json({
    enabled: settings.enabled,
    source: settings.source,
  });
}
