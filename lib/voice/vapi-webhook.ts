/**
 * Parse native Vapi Server URL payloads into VoiceInboundEvent.
 */
import type { VoiceInboundEvent } from "@/lib/voice/inbound";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickPhone(raw: unknown): string {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "";
}

/**
 * Accepts Vapi envelope `{ message: { type, call, summary, ... } }`
 * or returns handled:false so legacy normalizeVoiceEvent can run.
 */
export function parseVapiServerPayload(raw: unknown): {
  handled: boolean;
  skip: boolean;
  event: VoiceInboundEvent | null;
  messageType: string | null;
} {
  const root = asRecord(raw);
  if (!root) {
    return { handled: false, skip: false, event: null, messageType: null };
  }

  const message = asRecord(root.message) ?? root;
  const type = typeof message.type === "string" ? message.type : null;

  if (!type) {
    return { handled: false, skip: false, event: null, messageType: null };
  }

  if (
    type === "status-update" ||
    type === "speech-update" ||
    type === "transcript" ||
    type === "assistant-request" ||
    type === "conversation-update"
  ) {
    return { handled: true, skip: true, event: null, messageType: type };
  }

  if (type !== "end-of-call-report" && type !== "hang") {
    return { handled: true, skip: true, event: null, messageType: type };
  }

  const call = asRecord(message.call) ?? asRecord(root.call);
  const customer = call ? asRecord(call.customer) : null;
  const analysis = asRecord(message.analysis);

  const fromPhone =
    pickPhone(customer?.number) ||
    pickPhone(message.customerNumber) ||
    pickPhone(root.fromPhone);

  let summary = "";
  if (typeof message.summary === "string") summary = message.summary;
  else if (typeof analysis?.summary === "string") summary = analysis.summary;
  else if (typeof message.transcript === "string") summary = message.transcript.slice(0, 1500);

  const callId =
    (typeof call?.id === "string" && call.id) ||
    (typeof message.callId === "string" && message.callId) ||
    undefined;

  const endedReason = String(message.endedReason ?? call?.endedReason ?? "");
  const outcome: VoiceInboundEvent["outcome"] =
    /no-answer|busy|customer-did-not-answer|fail/i.test(endedReason) ? "missed" : "ended";

  if (!fromPhone) {
    return { handled: true, skip: false, messageType: type, event: null };
  }

  return {
    handled: true,
    skip: false,
    messageType: type,
    event: {
      fromPhone,
      callerName: pickPhone(customer?.name) || undefined,
      transcriptSummary: summary || `Vapi-Anruf ${outcome}`,
      callId,
      outcome,
    },
  };
}
