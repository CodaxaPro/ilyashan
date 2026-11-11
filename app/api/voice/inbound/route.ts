import { NextResponse } from "next/server";
import {
  authorizeVoiceWebhook,
  isVoiceAiEnabled,
  isVoiceWebhookConfigured,
  normalizeVoiceEvent,
  voiceEventToCallbackLead,
  voiceReadiness,
} from "@/lib/voice/inbound";
import { parseVapiServerPayload } from "@/lib/voice/vapi-webhook";
import { requestCallback } from "@/lib/assistant/sales/request-callback";

export async function GET() {
  return NextResponse.json({
    ...voiceReadiness(),
    webhookPath: "/api/voice/inbound",
    expects: "Vapi Server URL → end-of-call-report (Bearer VOICE_WEBHOOK_SECRET)",
  });
}

export async function POST(request: Request) {
  if (!isVoiceAiEnabled() || !isVoiceWebhookConfigured()) {
    return NextResponse.json(
      { error: "Voice AI nicht aktiviert oder Webhook-Secret fehlt.", readiness: voiceReadiness() },
      { status: 503 }
    );
  }

  if (!authorizeVoiceWebhook(request.headers.get("authorization"))) {
    // Also allow ?secret= for Vapi custom header limitations
    const url = new URL(request.url);
    const q = url.searchParams.get("secret");
    const secret = process.env.VOICE_WEBHOOK_SECRET?.trim();
    if (!secret || q !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const vapi = parseVapiServerPayload(body);
  if (vapi.handled && vapi.skip) {
    return NextResponse.json({ ok: true, skipped: true, messageType: vapi.messageType });
  }

  const event = vapi.event ?? normalizeVoiceEvent(body);
  if (!event) {
    return NextResponse.json(
      {
        error: "fromPhone / customer.number required",
        messageType: vapi.messageType,
      },
      { status: 400 }
    );
  }

  const mapped = voiceEventToCallbackLead(event);
  if (!mapped.ok) {
    return NextResponse.json(mapped, { status: 400 });
  }

  const result = await requestCallback({
    name: mapped.name,
    phone: mapped.phone,
    reason: mapped.session.salesNotes,
    session: mapped.session,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    provider: vapi.handled ? "vapi" : "generic",
    action: mapped.action,
    messageDe: result.messageDe,
    callId: event.callId ?? null,
  });
}
