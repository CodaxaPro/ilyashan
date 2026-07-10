import type { ConciergeIntent } from "./types";
import { messageFingerprint } from "./fuzzy";
import { suggestFaqForUnknown } from "./faq-match";

export type UnknownQueueStatus = "open" | "resolved" | "dismissed";

export interface UnknownQueueItem {
  id: string;
  fingerprint: string;
  message: string;
  intent: ConciergeIntent | string;
  sessionId?: string;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
  status: UnknownQueueStatus;
  suggestedFaqId?: string;
  suggestedFaqQuestion?: string;
}

const UNKNOWN_HASH_KEY = "ilyashan:unknown";
const UNKNOWN_RECENT_KEY = "ilyashan:unknown:recent";
const MAX_ITEMS = 300;

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function isUnknownQueueConfigured(): boolean {
  return isKvConfigured();
}

export async function recordUnknownMessage(input: {
  message: string;
  intent: ConciergeIntent | string;
  sessionId?: string;
}): Promise<void> {
  if (!isKvConfigured()) {
    console.info("[unknown-queue] KV not configured:", input.message.slice(0, 80));
    return;
  }

  const fingerprint = messageFingerprint(input.message);
  if (!fingerprint) return;

  try {
    const { kv } = await import("@vercel/kv");
    const now = new Date().toISOString();
    const existing = await kv.hget<UnknownQueueItem>(UNKNOWN_HASH_KEY, fingerprint);
    const suggestion = suggestFaqForUnknown(input.message);

    const item: UnknownQueueItem = existing
      ? {
          ...existing,
          message: input.message,
          intent: input.intent,
          sessionId: input.sessionId ?? existing.sessionId,
          count: existing.count + 1,
          lastSeenAt: now,
          status: existing.status === "open" ? "open" : existing.status,
          suggestedFaqId: suggestion?.id ?? existing.suggestedFaqId,
          suggestedFaqQuestion: suggestion?.question ?? existing.suggestedFaqQuestion,
        }
      : {
          id: `unk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fingerprint,
          message: input.message,
          intent: input.intent,
          sessionId: input.sessionId,
          count: 1,
          firstSeenAt: now,
          lastSeenAt: now,
          status: "open",
          suggestedFaqId: suggestion?.id,
          suggestedFaqQuestion: suggestion?.question,
        };

    await kv.hset(UNKNOWN_HASH_KEY, { [fingerprint]: item });
    await kv.zadd(UNKNOWN_RECENT_KEY, { score: Date.now(), member: fingerprint });
    await kv.zremrangebyrank(UNKNOWN_RECENT_KEY, 0, -(MAX_ITEMS + 1));
  } catch (error) {
    console.error("[unknown-queue] record failed:", error);
  }
}

export async function listUnknownMessages(
  status: UnknownQueueStatus | "all" = "open",
  limit = 100
): Promise<UnknownQueueItem[]> {
  if (!isKvConfigured()) return [];

  try {
    const { kv } = await import("@vercel/kv");
    const fingerprints = await kv.zrange<string[]>(UNKNOWN_RECENT_KEY, 0, limit - 1, {
      rev: true,
    });
    if (!fingerprints?.length) return [];

    const items = await Promise.all(
      fingerprints.map((fp) => kv.hget<UnknownQueueItem>(UNKNOWN_HASH_KEY, fp))
    );

    return items
      .filter((item): item is UnknownQueueItem => Boolean(item))
      .filter((item) => (status === "all" ? true : item.status === status))
      .sort((a, b) => b.count - a.count || b.lastSeenAt.localeCompare(a.lastSeenAt));
  } catch (error) {
    console.error("[unknown-queue] list failed:", error);
    return [];
  }
}

export async function updateUnknownMessageStatus(
  fingerprint: string,
  status: UnknownQueueStatus
): Promise<boolean> {
  if (!isKvConfigured()) return false;

  try {
    const { kv } = await import("@vercel/kv");
    const existing = await kv.hget<UnknownQueueItem>(UNKNOWN_HASH_KEY, fingerprint);
    if (!existing) return false;

    await kv.hset(UNKNOWN_HASH_KEY, {
      [fingerprint]: { ...existing, status },
    });
    return true;
  } catch (error) {
    console.error("[unknown-queue] update failed:", error);
    return false;
  }
}

export function shouldLogUnknownMessage(intent: ConciergeIntent): boolean {
  return intent === "unknown";
}
