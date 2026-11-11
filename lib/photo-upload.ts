export const MAX_PHOTOS = 20;
/** Nach Client-Kompression – Original-Handyfotos dürfen größer sein */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
/** Resend-/Mail-Limit: Rest der Fotos nur im Admin (KV) */
export const MAX_EMAIL_PHOTO_ATTACHMENTS = 10;

export const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface PhotoPayload {
  name: string;
  type: string;
  /** Base64-encoded file bytes (no data: URL prefix) */
  data: string;
}

export interface ResendPhotoAttachment {
  filename: string;
  /** Raw base64 (Resend) or Buffer — Buffer is more reliable for images. */
  content: string | Buffer;
  contentType: string;
}

export function photoLimitHelperTextDe(): string {
  return `Bis zu ${MAX_PHOTOS} Fotos · JPG/PNG/WebP · große Handyfotos werden automatisch verkleinert`;
}

export function normalizePhotoPayloads(raw: unknown): PhotoPayload[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is PhotoPayload => {
      if (!item || typeof item !== "object") return false;
      const p = item as PhotoPayload;
      return (
        typeof p.name === "string" &&
        typeof p.type === "string" &&
        typeof p.data === "string" &&
        p.data.length > 0
      );
    })
    .slice(0, MAX_PHOTOS);
}

export function validatePhotos(photos: PhotoPayload[]): string | null {
  if (photos.length > MAX_PHOTOS) {
    return `Maximal ${MAX_PHOTOS} Fotos erlaubt.`;
  }

  for (const photo of photos) {
    if (!ALLOWED_PHOTO_TYPES.has(photo.type)) {
      return "Nur JPG, PNG oder WebP Fotos sind erlaubt.";
    }

    let bytes: Buffer;
    try {
      bytes = Buffer.from(photo.data, "base64");
    } catch {
      return "Foto konnte nicht verarbeitet werden.";
    }

    if (bytes.length === 0) {
      return "Leere Fotodatei.";
    }

    if (bytes.length > MAX_PHOTO_BYTES) {
      return `Jedes Foto darf maximal ${Math.round(MAX_PHOTO_BYTES / (1024 * 1024))} MB groß sein (nach Verkleinerung).`;
    }
  }

  return null;
}

export function photosToResendAttachments(
  photos: PhotoPayload[],
  limit = MAX_EMAIL_PHOTO_ATTACHMENTS
): ResendPhotoAttachment[] {
  return photos.slice(0, Math.max(0, limit)).map((photo, index) => {
    const contentType = ALLOWED_PHOTO_TYPES.has(photo.type) ? photo.type : "image/jpeg";
    const ext =
      contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const safeName = photo.name.replace(/[^\w.\-äöüÄÖÜß ]/g, "_").slice(0, 60);
    const filename = safeName.includes(".") ? safeName : `fenster-foto-${index + 1}.${ext}`;
    // Buffer + contentType: Resend liefert Anhänge sonst oft ohne Bilddarstellung.
    return {
      filename,
      content: Buffer.from(photo.data, "base64"),
      contentType,
    };
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function canvasToJpegFile(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number,
  fileName: string
): Promise<File | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) return null;
  return new File([blob], fileName, { type: "image/jpeg", lastModified: Date.now() });
}

/**
 * Client-side: Bilder vor Upload verkleinern (Payload-/Mail-Limit).
 * Handy-Originale (oft 5–12 MB) → handliche JPEGs, Nutzer muss nichts einstellen.
 */
export async function compressImageFileForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  const targetName = `${(file.name.replace(/\.[^.]+$/, "") || "fenster-foto").slice(0, 40)}.jpg`;
  /** Aggressiver als früher: 20 Fotos müssen unter typ. Server-Body-Limits bleiben */
  const passes: { maxEdge: number; quality: number }[] = [
    { maxEdge: 1400, quality: 0.7 },
    { maxEdge: 1200, quality: 0.62 },
    { maxEdge: 1024, quality: 0.55 },
  ];
  const targetBytes = 350 * 1024;

  try {
    const bitmap = await createImageBitmap(file);
    let best: File | null = null;

    for (const pass of passes) {
      const scale = Math.min(1, pass.maxEdge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const next = await canvasToJpegFile(bitmap, width, height, pass.quality, targetName);
      if (!next) continue;
      best = next;
      if (next.size <= targetBytes) break;
    }

    bitmap.close();
    return best ?? file;
  } catch {
    return file;
  }
}

export async function readFileAsPhotoPayload(file: File): Promise<PhotoPayload> {
  const prepared = await compressImageFileForUpload(file);
  const buffer = await prepared.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return {
    name: prepared.name,
    type: prepared.type || "image/jpeg",
    data: bytesToBase64(bytes),
  };
}
