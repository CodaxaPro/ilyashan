"use client";

import { useRef, useState } from "react";
import {
  MAX_PHOTOS,
  type PhotoPayload,
  readFileAsPhotoPayload,
  validatePhotos,
} from "@/lib/photo-upload";

interface PhotoUploaderProps {
  photos: PhotoPayload[];
  onChange: (photos: PhotoPayload[]) => void;
  testId?: string;
}

export function PhotoUploader({ photos, onChange, testId = "photo-uploader" }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const next = [...photos];
      for (const file of Array.from(fileList)) {
        if (next.length >= MAX_PHOTOS) break;
        const payload = await readFileAsPhotoPayload(file);
        next.push(payload);
      }

      const validationError = validatePhotos(next);
      if (validationError) {
        setError(validationError);
        return;
      }

      onChange(next);
    } catch {
      setError("Fotos konnten nicht geladen werden.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
    setError(null);
  }

  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Fotos (optional)</p>
          <p className="text-xs text-muted">
            Bis zu {MAX_PHOTOS} Fotos · JPG/PNG/WebP · max. 2 MB je Foto
          </p>
        </div>
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="shrink-0 px-3 py-2 rounded-xl border border-primary/30 text-primary text-xs font-semibold hover:bg-primary-light/40 disabled:opacity-50"
            data-testid={`${testId}-add`}
          >
            {loading ? "Lädt…" : "Foto hinzufügen"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
        data-testid={`${testId}-input`}
      />

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <li
              key={`${photo.name}-${index}`}
              className="relative rounded-xl border border-border bg-white p-2 text-center"
              data-testid={`${testId}-item-${index}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${photo.type};base64,${photo.data}`}
                alt={photo.name}
                className="h-16 w-full object-cover rounded-lg mb-2"
              />
              <p className="text-[10px] text-muted truncate">{photo.name}</p>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs"
                aria-label="Foto entfernen"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-xs text-red-600" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
