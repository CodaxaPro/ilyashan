export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

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
      return `Jedes Foto darf maximal ${MAX_PHOTO_BYTES / (1024 * 1024)} MB groß sein.`;
    }
  }

  return null;
}

export function photosToResendAttachments(photos: PhotoPayload[]): ResendPhotoAttachment[] {
  return photos.map((photo, index) => {
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

/**
 * Client-side: Bilder vor Upload verkleinern (Payload-/Mail-Limit).
 * Max. Kantenlänge 1600px, JPEG ~0.72 — Ziel unter ~900 KB.
 */
export async function compressImageFileForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;

  const maxEdge = 1600;
  const quality = 0.72;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "fenster-foto";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
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
