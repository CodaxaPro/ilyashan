import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";

export async function requireAdminSession() {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin erişimi yapılandırılmamış (ADMIN_PASSWORD eksik)." },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  return null;
}
