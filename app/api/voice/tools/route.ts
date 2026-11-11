import { NextResponse } from "next/server";
import {
  authorizeVoiceWebhook,
  isVoiceAiEnabled,
  isVoiceWebhookConfigured,
  voiceReadiness,
} from "@/lib/voice/inbound";
import { parseVoiceToolInvocation, runVoiceTool } from "@/lib/voice/tools";

function authorize(request: Request): boolean {
  if (authorizeVoiceWebhook(request.headers.get("authorization"))) return true;
  const url = new URL(request.url);
  const q = url.searchParams.get("secret");
  const secret = process.env.VOICE_WEBHOOK_SECRET?.trim();
  return Boolean(secret && q === secret);
}

export async function GET() {
  return NextResponse.json({
    ...voiceReadiness(),
    tools: ["price_fenster", "get_available_slots", "book_appointment", "request_callback"],
  });
}

export async function POST(request: Request) {
  if (!isVoiceAiEnabled() || !isVoiceWebhookConfigured()) {
    return NextResponse.json(
      { error: "Voice AI nicht aktiviert.", readiness: voiceReadiness() },
      { status: 503 }
    );
  }
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invocations = parseVoiceToolInvocation(body);
  if (invocations.length === 0) {
    return NextResponse.json({ error: "No tool call" }, { status: 400 });
  }

  const results = [];
  for (const inv of invocations) {
    if (!inv.name) {
      results.push({
        toolCallId: inv.toolCallId,
        result: "Unbekanntes Tool.",
      });
      continue;
    }
    const out = await runVoiceTool(inv.name, inv.args);
    results.push({
      toolCallId: inv.toolCallId,
      result: out.speakDe,
      ok: out.ok,
      data: out.data,
    });
  }

  // Vapi expects { results: [{ toolCallId, result }] }
  return NextResponse.json({
    results: results.map((r) => ({
      toolCallId: r.toolCallId,
      result: r.result,
    })),
    // Direct/debug echo
    tools: results,
  });
}
