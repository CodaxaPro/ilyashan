import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import {
  getConciergeSettings,
  isConciergeSettingsStoreConfigured,
  setConciergeEnabled,
} from "@/lib/concierge-settings";

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

  const concierge = await getConciergeSettings();
  return NextResponse.json({
    concierge,
    storageConfigured: isConciergeSettingsStoreConfigured(),
  });
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json()) as { conciergeEnabled?: boolean };
  if (typeof body.conciergeEnabled !== "boolean") {
    return NextResponse.json({ error: "conciergeEnabled (boolean) erforderlich." }, { status: 400 });
  }

  if (!isConciergeSettingsStoreConfigured()) {
    return NextResponse.json(
      {
        error:
          "KV-Speicher nicht konfiguriert. Lokal: CONCIERGE_ENABLED=true in .env.local setzen.",
      },
      { status: 503 }
    );
  }

  const current = await getConciergeSettings();
  if (current.source === "env") {
    return NextResponse.json(
      {
        error:
          "CONCIERGE_ENABLED ist in den Umgebungsvariablen gesetzt und überschreibt den Admin-Schalter.",
      },
      { status: 409 }
    );
  }

  const ok = await setConciergeEnabled(body.conciergeEnabled);
  if (!ok) {
    return NextResponse.json({ error: "Einstellung konnte nicht gespeichert werden." }, { status: 500 });
  }

  const concierge = await getConciergeSettings();
  return NextResponse.json({ success: true, concierge });
}
