import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import {
  getFensterPricingConfig,
  isPricingConfigStoreConfigured,
  setFensterPricingConfig,
  type FensterPricingConfig,
} from "@/lib/pricing-config";

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

  const config = await getFensterPricingConfig();
  return NextResponse.json({
    config,
    storageConfigured: isPricingConfigStoreConfigured(),
  });
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  if (!isPricingConfigStoreConfigured()) {
    return NextResponse.json(
      { error: "KV-Speicher nicht konfiguriert. Vercel Upstash Redis verbinden." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Partial<FensterPricingConfig>;
  const config = await setFensterPricingConfig(body);
  return NextResponse.json({ success: true, config });
}
