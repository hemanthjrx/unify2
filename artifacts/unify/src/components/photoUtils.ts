export interface UploadedPhoto {
  objectPath: string;
  previewUrl: string;
  name: string;
}

export function photosToObjectPaths(photos: UploadedPhoto[]): string[] {
  return photos.map((p) => p.objectPath);
}

export function objectPathsToPhotos(paths: string[]): UploadedPhoto[] {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return paths.map((p) => {
    // New paths: /api/uploads/<filename> — use directly
    // Legacy paths: /objects/<uuid> — serve via /api/storage
    const previewUrl = p.startsWith("/api/uploads/")
      ? `${base}${p}`
      : `${base}/api/storage${p}`;
    return { objectPath: p, previewUrl, name: p.split("/").pop() ?? "image" };
  });
}
