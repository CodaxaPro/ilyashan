import { NextResponse } from "next/server";
import type { AnalyticsCollectBody } from "@/lib/analytics/types";
import { extractRequestGeo, ingestAnalyticsBatch, isAnalyticsStoreConfigured } from "@/lib/analytics/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAnalyticsStoreConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const body = (await request.json()) as AnalyticsCollectBody;
    const geo = extractRequestGeo(request);
    const result = await ingestAnalyticsBatch(body, geo);

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Kayıt başarısız" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
}
