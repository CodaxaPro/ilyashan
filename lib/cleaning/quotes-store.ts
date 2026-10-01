import { kv } from "@vercel/kv";
import type { CleaningQuoteSnapshot } from "./snapshot";

const QUOTES_KEY = "ilyashan:cleaning-quotes";
const MAX_QUOTES = 200;

function isKvConfigured(): boolean {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return Boolean(url && token);
}

export interface StoredCleaningQuote {
  id: string;
  createdAt: string;
  quoteReference: string;
  company: string;
  contactPerson: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  totalAreaM2: number;
  frequency: string;
  netCents: number;
  grossCents: number;
  quoteStatus: string;
  configVersionId: string;
  /** Full immutable snapshot */
  snapshot: CleaningQuoteSnapshot;
  /** Placeholder for P3 CRM parity — not wired to Fenster leads yet */
  serviceLine: "buero";
}

export function createCleaningQuoteId(): string {
  return `buero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveCleaningQuote(quote: StoredCleaningQuote): Promise<boolean> {
  if (!isKvConfigured()) {
    console.warn("[cleaning-quotes] KV not configured — quote not persisted:", quote.quoteReference);
    return false;
  }
  await kv.lpush(QUOTES_KEY, quote);
  await kv.ltrim(QUOTES_KEY, 0, MAX_QUOTES - 1);
  return true;
}

export async function listCleaningQuotes(limit = 50): Promise<StoredCleaningQuote[]> {
  if (!isKvConfigured()) return [];
  const items = await kv.lrange<StoredCleaningQuote>(QUOTES_KEY, 0, Math.min(limit, MAX_QUOTES) - 1);
  return items ?? [];
}

export async function getCleaningQuoteByReference(
  quoteReference: string
): Promise<StoredCleaningQuote | null> {
  const items = await listCleaningQuotes(MAX_QUOTES);
  return items.find((q) => q.quoteReference === quoteReference) ?? null;
}

export function isCleaningQuotesStoreConfigured(): boolean {
  return isKvConfigured();
}
