import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import {
  getAnalyticsOverview,
  getChannelStats,
  getClickStats,
  getConciergeStats,
  getFunnelStats,
  getGeoStats,
  getLiveSessions,
  getPageStats,
  getReferrerStats,
  listSessions,
} from "@/lib/analytics/queries";
import { isAnalyticsStoreConfigured } from "@/lib/analytics/store";

export async function GET(request: Request) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days") ?? "7")));
  const section = searchParams.get("section") ?? "overview";

  if (!isAnalyticsStoreConfigured()) {
    return NextResponse.json({
      configured: false,
      error: "Supabase yapılandırılmamış. SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ekleyin.",
    });
  }

  switch (section) {
    case "overview":
      return NextResponse.json({
        configured: true,
        overview: await getAnalyticsOverview(days),
      });
    case "live":
      return NextResponse.json({
        configured: true,
        live: await getLiveSessions(5),
      });
    case "channels":
      return NextResponse.json({
        configured: true,
        channels: await getChannelStats(days),
        referrers: await getReferrerStats(days),
      });
    case "pages":
      return NextResponse.json({
        configured: true,
        pages: await getPageStats(days),
      });
    case "clicks":
      return NextResponse.json({
        configured: true,
        clicks: await getClickStats(days),
      });
    case "funnel":
      return NextResponse.json({
        configured: true,
        funnel: await getFunnelStats(days),
      });
    case "concierge":
      return NextResponse.json({
        configured: true,
        concierge: await getConciergeStats(days),
      });
    case "locations":
      return NextResponse.json({
        configured: true,
        geo: await getGeoStats(days),
      });
    case "sessions": {
      const limit = Math.min(100, Number(searchParams.get("limit") ?? "50"));
      const offset = Math.max(0, Number(searchParams.get("offset") ?? "0"));
      const result = await listSessions(limit, offset, days);
      return NextResponse.json({ configured: true, ...result });
    }
    default:
      return NextResponse.json({ error: "Geçersiz section" }, { status: 400 });
  }
}
