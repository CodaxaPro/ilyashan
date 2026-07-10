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
  content: string;
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
    const ext =
      photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const safeName = photo.name.replace(/[^\w.\-äöüÄÖÜß ]/g, "_").slice(0, 60);
    const filename = safeName.includes(".") ? safeName : `fenster-foto-${index + 1}.${ext}`;
    return { filename, content: photo.data };
  });
}

export async function readFileAsPhotoPayload(file: File): Promise<PhotoPayload> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    name: file.name,
    type: file.type,
    data: btoa(binary),
  };
}
