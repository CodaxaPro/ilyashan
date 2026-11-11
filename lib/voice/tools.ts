/**
 * Mid-call voice tools — same engines as chat (price / slots / book / callback).
 */
import { createSession } from "@/lib/concierge/types";
import type { ConciergeSession } from "@/lib/concierge/types";
import { applyFensterStructuredFields } from "@/lib/assistant/dialog/fenster";
import { bookAppointmentFromChat } from "@/lib/assistant/sales/book-from-chat";
import { requestCallback } from "@/lib/assistant/sales/request-callback";
import { listProposedSlots } from "@/lib/assistant/sales/slots";
import type { FloorLevel } from "@/lib/quote-form";
import type { BookableTimeSlot } from "@/lib/scheduling/slot-engine";
import { TIME_SLOT_LABELS_DE } from "@/lib/scheduling/slot-engine";

const FLOOR_MAP: Record<string, FloorLevel> = {
  eg: "eg",
  erdgeschoss: "eg",
  "erdgeschoss (eg)": "eg",
  "0": "eg",
  og1: "og1",
  "1": "og1",
  "1.og": "og1",
  "1. og": "og1",
  "1. obergeschoss": "og1",
  og2: "og2",
  "2": "og2",
  "2.og": "og2",
  "2. og": "og2",
  og3: "og3",
  "3": "og3",
  "3.og": "og3",
  "3. og": "og3",
  og4: "og4",
  "4": "og4",
  og5plus: "og5plus",
  "5": "og5plus",
  "5+": "og5plus",
  dg: "dg",
  dachgeschoss: "dg",
};

export function normalizeFloorLevel(raw: unknown): FloorLevel | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return FLOOR_MAP[key] ?? FLOOR_MAP[key.replace(/\./g, "")];
}

function isBookableSlot(slot: string): slot is BookableTimeSlot {
  return slot === "vormittag" || slot === "nachmittag" || slot === "flexibel";
}

function sessionFromVoice(args: {
  callId?: string;
  windowCount?: number;
  floorLevel?: FloorLevel;
  preferredDate?: string;
  timeSlot?: BookableTimeSlot;
  notes?: string;
}): ConciergeSession {
  const session = createSession(`voice-tool-${args.callId ?? Date.now()}`);
  session.assistantProduct = "fenster";
  if (typeof args.windowCount === "number" && args.windowCount >= 1) {
    session.quote.windowCount = Math.round(args.windowCount);
  }
  if (args.floorLevel) session.quote.floorLevel = args.floorLevel;
  if (args.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(args.preferredDate)) {
    session.quote.preferredDates = [args.preferredDate];
    session.quote.scheduleOption = "wunschtermine";
  }
  if (args.notes?.trim()) {
    session.salesNotes = args.notes.trim();
    session.quote.additionalInfo = args.notes.trim();
  }
  return session;
}

export type VoiceToolName =
  | "price_fenster"
  | "get_available_slots"
  | "book_appointment"
  | "request_callback";

export type VoiceToolArgs = Record<string, unknown>;

export async function runVoiceTool(
  name: VoiceToolName,
  args: VoiceToolArgs
): Promise<{ ok: boolean; speakDe: string; data?: Record<string, unknown> }> {
  const callId = args.callId ? String(args.callId) : undefined;

  if (name === "price_fenster") {
    const windowCount = Number(args.windowCount ?? args.fluegel ?? 0);
    const floorLevel = normalizeFloorLevel(args.floorLevel ?? args.etage);
    const session = sessionFromVoice({
      callId,
      windowCount: Number.isFinite(windowCount) ? windowCount : undefined,
      floorLevel,
    });
    const priced = applyFensterStructuredFields(session, {
      windowCount: Number.isFinite(windowCount) && windowCount >= 1 ? windowCount : undefined,
      floorLevel,
    });
    return {
      ok: priced.complete,
      speakDe: priced.text.replace(/\*\*/g, ""),
      data: {
        complete: priced.complete,
        windowCount: priced.session.quote.windowCount,
        floorLevel: priced.session.quote.floorLevel,
      },
    };
  }

  if (name === "get_available_slots") {
    const limit = Math.min(8, Math.max(2, Number(args.limit ?? 6) || 6));
    const slots = await listProposedSlots(limit);
    if (slots.length === 0) {
      return {
        ok: false,
        speakDe:
          "Aktuell sind online keine freien Termine sichtbar. Ich notiere Ihren Wunsch und das Team meldet sich.",
      };
    }
    const lines = slots.map((s) => s.labelDe).join("; ");
    return {
      ok: true,
      speakDe: `Nächste freie Termine: ${lines}. Welchen möchten Sie?`,
      data: { slots },
    };
  }

  if (name === "book_appointment") {
    const nameCustomer = String(args.name ?? args.customerName ?? "").trim();
    const phone = String(args.phone ?? args.fromPhone ?? "").trim();
    const date = String(args.date ?? args.preferredDate ?? "").trim();
    const timeSlotRaw = String(args.timeSlot ?? "vormittag").trim().toLowerCase();
    const windowCount = Number(args.windowCount ?? 0);
    const floorLevel = normalizeFloorLevel(args.floorLevel ?? args.etage);

    if (!nameCustomer || !phone) {
      return {
        ok: false,
        speakDe: "Für die Terminbuchung brauche ich noch Ihren Namen und die Telefonnummer.",
      };
    }
    if (!isBookableSlot(timeSlotRaw)) {
      return {
        ok: false,
        speakDe: "Bitte Vormittag oder Nachmittag wählen.",
      };
    }
    if (!Number.isFinite(windowCount) || windowCount < 1) {
      return {
        ok: false,
        speakDe:
          "Für die Online-Terminbuchung brauche ich noch die ungefähre Anzahl der Fensterflügel.",
      };
    }

    const session = sessionFromVoice({
      callId,
      windowCount,
      floorLevel: floorLevel ?? "eg",
      preferredDate: date,
      timeSlot: timeSlotRaw,
      notes: `[Voice-Buchung] ${String(args.notes ?? "").slice(0, 500)}`,
    });
    if (!floorLevel) session.quote.floorLevel = "eg";

    const booked = await bookAppointmentFromChat({
      name: nameCustomer,
      phone,
      date,
      timeSlot: timeSlotRaw,
      session,
    });

    if (!booked.ok) {
      return { ok: false, speakDe: booked.messageDe.replace(/\*\*/g, "") };
    }

    return {
      ok: true,
      speakDe: booked.messageDe.replace(/\*\*/g, ""),
      data: {
        leadId: booked.leadId,
        confirmedDate: booked.confirmedDate,
        timeSlot: booked.timeSlot,
        slotLabel: TIME_SLOT_LABELS_DE[booked.timeSlot],
      },
    };
  }

  if (name === "request_callback") {
    const nameCustomer = String(args.name ?? args.customerName ?? "Telefonanruf").trim();
    const phone = String(args.phone ?? args.fromPhone ?? "").trim();
    const preferredDate = String(args.date ?? args.preferredDate ?? "").trim();
    const timeSlotRaw = String(args.timeSlot ?? "").trim().toLowerCase();
    const reason = String(args.reason ?? args.notes ?? "").trim();
    const windowCount = Number(args.windowCount ?? 0);
    const floorLevel = normalizeFloorLevel(args.floorLevel ?? args.etage);

    if (!phone) {
      return { ok: false, speakDe: "Bitte die Telefonnummer bestätigen, unter der wir zurückrufen." };
    }

    const session = sessionFromVoice({
      callId,
      windowCount: Number.isFinite(windowCount) && windowCount >= 1 ? windowCount : undefined,
      floorLevel,
      preferredDate: /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) ? preferredDate : undefined,
      timeSlot: isBookableSlot(timeSlotRaw) ? timeSlotRaw : undefined,
      notes: reason || "Rückruf nach Telefonat",
    });

    if (isBookableSlot(timeSlotRaw) && preferredDate) {
      session.quote.preferredDates = [preferredDate];
      session.quote.scheduleOption = "wunschtermine";
    }

    const result = await requestCallback({
      name: nameCustomer || "Telefonanruf",
      phone,
      session,
      reason: [
        reason || "Voice Rückruf",
        preferredDate ? `Wunschtermin: ${preferredDate}` : null,
        isBookableSlot(timeSlotRaw) ? `Slot: ${TIME_SLOT_LABELS_DE[timeSlotRaw]}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });

    if (!result.ok) {
      return { ok: false, speakDe: result.messageDe };
    }
    return { ok: true, speakDe: result.messageDe };
  }

  return { ok: false, speakDe: "Unbekanntes Tool." };
}

export function parseVoiceToolInvocation(body: unknown): {
  toolCallId?: string;
  name: VoiceToolName | null;
  args: VoiceToolArgs;
}[] {
  if (!body || typeof body !== "object") return [];
  const root = body as Record<string, unknown>;
  const message =
    root.message && typeof root.message === "object"
      ? (root.message as Record<string, unknown>)
      : root;

  const calls =
    (Array.isArray(message.toolCalls) && message.toolCalls) ||
    (Array.isArray(message.toolCallList) && message.toolCallList) ||
    (Array.isArray(root.toolCalls) && root.toolCalls) ||
    [];

  if (calls.length > 0) {
    return calls.map((raw) => {
      const c = raw as Record<string, unknown>;
      const fn =
        c.function && typeof c.function === "object"
          ? (c.function as Record<string, unknown>)
          : c;
      let args: VoiceToolArgs = {};
      const argRaw = fn.arguments ?? c.arguments;
      if (typeof argRaw === "string") {
        try {
          args = JSON.parse(argRaw) as VoiceToolArgs;
        } catch {
          args = {};
        }
      } else if (argRaw && typeof argRaw === "object") {
        args = argRaw as VoiceToolArgs;
      }
      const name = String(fn.name ?? c.name ?? "") as VoiceToolName;
      return {
        toolCallId: c.id ? String(c.id) : undefined,
        name: isVoiceToolName(name) ? name : null,
        args,
      };
    });
  }

  // Direct test / single-tool body
  const name = String(root.tool ?? root.name ?? "") as VoiceToolName;
  const args =
    root.arguments && typeof root.arguments === "object"
      ? (root.arguments as VoiceToolArgs)
      : (root as VoiceToolArgs);
  if (isVoiceToolName(name)) {
    return [{ name, args }];
  }
  return [];
}

function isVoiceToolName(name: string): name is VoiceToolName {
  return (
    name === "price_fenster" ||
    name === "get_available_slots" ||
    name === "book_appointment" ||
    name === "request_callback"
  );
}
