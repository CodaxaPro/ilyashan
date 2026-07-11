import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { getSessionDetail } from "@/lib/analytics/queries";
import { isAnalyticsStoreConfigured } from "@/lib/analytics/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminSession();
  if (authError) return authError;

  if (!isAnalyticsStoreConfigured()) {
    return NextResponse.json({ error: "Supabase yapılandırılmamış." }, { status: 503 });
  }

  const { id } = await context.params;
  const detail = await getSessionDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(detail);
}
