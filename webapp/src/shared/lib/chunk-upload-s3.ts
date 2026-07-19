import { uploadApi } from "./upload-api";

/** ขนาด chunk ต่อ part (S3 minimum 5MB, ใช้ 5MB เป็น default) */
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

export type ChunkUploadOptions = {
  /** Prefix ของ key ใน bucket เช่น "uploads/large" */
  keyPrefix?: string;
  /** ขนาดต่อ chunk (bytes), default 5MB */
  chunkSize?: number;
  /** เรียกหลังอัปโหลดแต่ละ part: (loadedBytes, totalBytes) */
  onProgress?: (loaded: number, total: number) => void;
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "file";
}

/**
 * แบ่งไฟล์เป็น chunks แล้วอัปโหลดผ่าน S3 Multipart (presigned URL)
 * คืน key ที่ใช้เก็บใน DB และ preview ผ่าน config.filesUrl(key)
 */
export async function uploadLargeFileInChunks(
  file: File,
  options: ChunkUploadOptions = {},
): Promise<string> {
  const {
    keyPrefix = "uploads",
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
  } = options;

  const ext = file.name.includes(".") ? (file.name.split(".").pop() ?? "") : "";
  const baseName = file.name.includes(".")
    ? file.name.slice(0, file.name.lastIndexOf("."))
    : file.name;
  const safeBase = sanitizeFilename(baseName);
  const key = `${keyPrefix}/${Date.now()}-${safeBase}${ext ? `.${ext}` : ""}`;
  const contentType = file.type || undefined;

  const totalSize = file.size;
  const partCount = Math.ceil(totalSize / chunkSize);
  const partNumbers = Array.from({ length: partCount }, (_, i) => i + 1);

  const { uploadId } = await uploadApi.multipartInit({ key, contentType });

  try {
    const { parts: presignedParts } = await uploadApi.multipartPresignParts({
      key,
      uploadId,
      partNumbers,
    });

    const completedParts: { partNumber: number; etag: string }[] = [];
    let loaded = 0;

    for (let i = 0; i < partCount; i++) {
      const partNumber = partNumbers[i]!;
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const blob = file.slice(start, end);

      const partInfo = presignedParts.find((p) => p.partNumber === partNumber);
      if (!partInfo)
        throw new Error(`Missing presigned URL for part ${partNumber}`);

      const res = await fetch(partInfo.uploadUrl, {
        method: "PUT",
        body: blob,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Part ${partNumber} upload failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`,
        );
      }

      let etag = res.headers.get("ETag") ?? "";
      if (etag && !etag.startsWith('"')) etag = `"${etag}"`;
      completedParts.push({ partNumber, etag });

      loaded = end;
      onProgress?.(loaded, totalSize);
    }

    await uploadApi.multipartComplete({
      key,
      uploadId,
      parts: completedParts,
    });

    return key;
  } catch (err) {
    // ลบ chunks ที่อัปโหลดไปแล้ว (ทุก part ที่ upload ไปจะถูกลบจาก MinIO)
    await uploadApi.multipartAbort({ key, uploadId }).catch(() => {});
    throw err;
  }
}
