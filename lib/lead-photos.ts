/**
 * Lead-Fotos getrennt vom Lead-Listeneintrag speichern (KV-Größe).
 * Lead behält nur photoCount; Admin lädt Bilder on-demand.
 */
import type { PhotoPayload } from "@/lib/photo-upload";
import { normalizePhotoPayloads } from "@/lib/photo-upload";

const PHOTO_KEY_PREFIX = "ilyashan:lead-photos:";
/** 90 Tage – reicht für Angebot / Terminabwicklung */
const PHOTO_TTL_SECONDS = 60 * 60 * 24 * 90;

export type LeadPhoto = PhotoPayload;

function photoKey(leadId: string) {
  return `${PHOTO_KEY_PREFIX}${leadId}`;
}

function isKvConfigured(): boolean {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  return Boolean(url && token && !url.includes("HIER_IHREN") && !token.includes("HIER_IHREN"));
}

export async function saveLeadPhotos(leadId: string, photos: PhotoPayload[]): Promise<void> {
  const normalized = normalizePhotoPayloads(photos);
  if (!leadId || normalized.length === 0) return;
  if (!isKvConfigured()) {
    console.info("[lead-photos] KV not configured, skipping persist:", leadId);
    return;
  }

  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(photoKey(leadId), normalized, { ex: PHOTO_TTL_SECONDS });
  } catch (error) {
    console.error("[lead-photos] save failed:", error);
  }
}

export async function getLeadPhotos(leadId: string): Promise<LeadPhoto[]> {
  if (!leadId || !isKvConfigured()) return [];

  try {
    const { kv } = await import("@vercel/kv");
    const raw = await kv.get<LeadPhoto[]>(photoKey(leadId));
    return normalizePhotoPayloads(raw);
  } catch (error) {
    console.error("[lead-photos] get failed:", error);
    return [];
  }
}

export async function deleteLeadPhotos(leadId: string): Promise<void> {
  if (!leadId || !isKvConfigured()) return;

  try {
    const { kv } = await import("@vercel/kv");
    await kv.del(photoKey(leadId));
  } catch (error) {
    console.error("[lead-photos] delete failed:", error);
  }
}
