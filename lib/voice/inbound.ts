/**
 * P2 — Voice AI inbound webhook adapter.
 * Provider-agnostic: accepts normalized call events from Vapi / Twilio / Retell.
 * Without VOICE_WEBHOOK_SECRET configured → refuse (fail-closed).
 */
import { siteConfig } from "@/lib/config";
import type { ConciergeSession } from "@/lib/concierge/types";
import { createSession } from "@/lib/concierge/types";
import { validateLeadContact } from "@/lib/concierge/lead";

export type VoiceInboundEvent = {
  /** Caller phone E.164 or DE national */
  fromPhone: string;
  /** Optional caller name from provider */
  callerName?: string;
  /** Short transcript / intent summary */
  transcriptSummary?: string;
  /** Provider call id */
  callId?: string;
  /** ended | missed | transferred */
  outcome?: "ended" | "missed" | "transferred" | "callback_requested";
  /** Optional Wunschtermin YYYY-MM-DD from tool / analysis */
  preferredDate?: string;
  /** vormittag | nachmittag | flexibel */
  timeSlot?: "vormittag" | "nachmittag" | "flexibel";
  windowCount?: number;
};

export type VoiceInboundResult =
  | {
      ok: true;
      action: "callback_lead";
      name: string;
      phone: string;
      session: ConciergeSession;
      messageDe: string;
    }
  | { ok: false; code: string; messageDe: string };

export function isVoiceWebhookConfigured(): boolean {
  const secret = process.env.VOICE_WEBHOOK_SECRET?.trim();
  return Boolean(secret && !secret.includes("HIER_IHREN"));
}

export function isVoiceAiEnabled(): boolean {
  const raw = process.env.VOICE_AI_ENABLED?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function authorizeVoiceWebhook(authHeader: string | null): boolean {
  if (!isVoiceWebhookConfigured()) return false;
  const secret = process.env.VOICE_WEBHOOK_SECRET!.trim();
  return authHeader === `Bearer ${secret}`;
}

export function normalizeVoiceEvent(raw: unknown): VoiceInboundEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const fromPhone = String(
    o.fromPhone ?? o.from ?? o.caller_number ?? o.customerPhone ?? ""
  ).trim();
  if (!fromPhone) return null;
  return {
    fromPhone,
    callerName: o.callerName || o.caller_name || o.name
      ? String(o.callerName ?? o.caller_name ?? o.name)
      : undefined,
    transcriptSummary: o.transcriptSummary || o.summary || o.transcript
      ? String(o.transcriptSummary ?? o.summary ?? o.transcript).slice(0, 2000)
      : undefined,
    callId: o.callId || o.call_id ? String(o.callId ?? o.call_id) : undefined,
    outcome:
      o.outcome === "missed" ||
      o.outcome === "transferred" ||
      o.outcome === "callback_requested" ||
      o.outcome === "ended"
        ? o.outcome
        : "callback_requested",
  };
}

/**
 * Maps a voice event into a callback-ready lead payload (same CRM path as chat).
 */
export function voiceEventToCallbackLead(event: VoiceInboundEvent): VoiceInboundResult {
  const name = (event.callerName?.trim() || "Anruf-Kunde").slice(0, 80);
  const phone = event.fromPhone.trim();
  const validationError = validateLeadContact(name === "Anruf-Kunde" ? "Telefonanruf" : name, phone);
  if (validationError) {
    return { ok: false, code: "validation", messageDe: validationError };
  }

  const session = createSession(`voice-${event.callId ?? Date.now()}`);
  const noteParts = [
    `[Voice ${event.outcome ?? "callback_requested"}]`,
    event.callId ? `Call-ID: ${event.callId}` : null,
    event.transcriptSummary ? event.transcriptSummary : "Rückruf nach Telefonat erbeten.",
  ].filter(Boolean);

  session.salesNotes = noteParts.join("\n");
  session.quote = {
    ...session.quote,
    additionalInfo: noteParts.join("\n"),
  };
  if (event.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(event.preferredDate)) {
    session.quote.preferredDates = [event.preferredDate];
    session.quote.scheduleOption = "wunschtermine";
  }
  if (typeof event.windowCount === "number" && event.windowCount >= 1) {
    session.quote.windowCount = Math.round(event.windowCount);
    session.assistantProduct = "fenster";
  }

  return {
    ok: true,
    action: "callback_lead",
    name: name === "Anruf-Kunde" ? "Telefonanruf" : name,
    phone,
    session,
    messageDe: `Anruf erfasst — Team ruft zurück (${siteConfig.business.responseTime}).`,
  };
}

export function voiceReadiness(): {
  enabled: boolean;
  webhookConfigured: boolean;
  ready: boolean;
  hintDe: string;
} {
  const enabled = isVoiceAiEnabled();
  const webhookConfigured = isVoiceWebhookConfigured();
  const ready = enabled && webhookConfigured;
  return {
    enabled,
    webhookConfigured,
    ready,
    hintDe: ready
      ? "Voice-Webhook aktiv — Provider kann Anrufe an /api/voice/inbound senden."
      : "Voice AI: VOICE_AI_ENABLED=true und VOICE_WEBHOOK_SECRET setzen, dann Vapi/Twilio anbinden.",
  };
}
