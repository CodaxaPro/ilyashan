import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { getStaffConfig, setStaffConfig, sanitizeStaffConfig } from "@/lib/staff/config";
import type { StaffConfig } from "@/lib/staff/types";

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

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const config = await getStaffConfig();
  return NextResponse.json({ config, storageConfigured: Boolean(process.env.KV_REST_API_URL) });
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json().catch(() => ({}))) as Partial<StaffConfig>;
  const config = await setStaffConfig(body);
  return NextResponse.json({ success: true, config: sanitizeStaffConfig(config) });
}
