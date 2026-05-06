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
  return paths.map((p) => ({
    objectPath: p,
    previewUrl: `${base}/api/storage${p}`,
    name: p.split("/").pop() ?? "image",
  }));
}
