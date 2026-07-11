import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";

export async function GET() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ configured: false, authenticated: false });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  const authenticated = verifyAdminSessionToken(token);

  return NextResponse.json({ configured: true, authenticated });
}
