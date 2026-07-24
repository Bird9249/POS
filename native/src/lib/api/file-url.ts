import { apiUrl } from "./config";

/** Resolve stored object key / absolute URL / blob preview to an <img> src. */
export function resolveFileSrc(
  keyOrUrl: string | null | undefined,
  localPreview?: string | null,
): string | null {
  if (localPreview) return localPreview;
  if (!keyOrUrl) return null;
  if (
    keyOrUrl.startsWith("http://") ||
    keyOrUrl.startsWith("https://") ||
    keyOrUrl.startsWith("blob:") ||
    keyOrUrl.startsWith("data:")
  ) {
    return keyOrUrl;
  }
  const key = keyOrUrl.replace(/^\//, "");
  return apiUrl(`/api/files/${key}`);
}
