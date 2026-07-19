import { useRef, useState } from "react";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { useAuthenticatedFetch } from "@/lib/api-fetch";
import type { UploadedPhoto } from "./photoUtils";

export type { UploadedPhoto } from "./photoUtils";
export { photosToObjectPaths, objectPathsToPhotos } from "./photoUtils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 10;

interface PhotoUploaderProps {
  value: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({
  value,
  onChange,
  maxPhotos = MAX_PHOTOS,
}: PhotoUploaderProps) {
  const afetch = useAuthenticatedFetch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    const remaining = maxPhotos - value.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    const oversized = selected.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`Files must be under ${MAX_SIZE_MB}MB`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const uploaded: UploadedPhoto[] = [];
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await afetch(`${BASE}/api/uploads/image`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { url } = await res.json();
        uploaded.push({ objectPath: url, previewUrl: `${BASE}${url}`, name: file.name });
      }
      onChange([...value, ...uploaded]);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const canAdd = value.length < maxPhotos && !uploading;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((photo, idx) => (
          <div key={photo.objectPath} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted group">
            <img
              src={photo.previewUrl}
              alt={photo.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {uploading && (
          <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        )}

        {canAdd && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/60 flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Add photo</span>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">{value.length}/{maxPhotos} photo{value.length !== 1 ? "s" : ""}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
