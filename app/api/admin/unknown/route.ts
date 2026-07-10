import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from "@/lib/admin-auth";
import {
  isUnknownQueueConfigured,
  listUnknownMessages,
  updateUnknownMessageStatus,
  type UnknownQueueStatus,
} from "@/lib/concierge/unknown-queue";

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

export async function GET(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") ?? "open") as UnknownQueueStatus | "all";
  const items = await listUnknownMessages(status);

  return NextResponse.json({
    items,
    storageConfigured: isUnknownQueueConfigured(),
  });
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const body = (await request.json()) as {
    fingerprint?: string;
    status?: UnknownQueueStatus;
  };

  if (!body.fingerprint || !body.status) {
    return NextResponse.json({ error: "fingerprint und status erforderlich." }, { status: 400 });
  }

  if (!["resolved", "dismissed", "open"].includes(body.status)) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  const ok = await updateUnknownMessageStatus(body.fingerprint, body.status);
  if (!ok) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
