import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import { isLeadsStoreConfigured, listLeads } from "@/lib/leads-store";

async function requireAdmin() {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin-Zugang ist nicht konfiguriert (ADMIN_PASSWORD fehlt)." },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  return null;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const leads = await listLeads(100);
  return NextResponse.json({
    leads,
    storageConfigured: isLeadsStoreConfigured(),
  });
}
