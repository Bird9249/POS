import { uploadApi } from "@/shared/lib/upload-api";
import { uploadFileToPresignedUrl } from "@/shared/lib/upload-to-presigned";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "image";
}

/**
 * อัปโหลดรูปไป MinIO ผ่าน presign แล้วคืน key
 * ใช้ตอน submit form เมื่อเก็บไฟล์ไว้ก่อน
 */
export async function uploadImageToKey(
  keyPrefix: string,
  file: File,
): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const safeExt = /^(jpe?g|png|gif|webp)$/.test(ext) ? ext : "jpg";
  const baseName = file.name.includes(".")
    ? file.name.slice(0, file.name.lastIndexOf("."))
    : file.name;
  const safeBase = sanitizeFilename(baseName);
  const key = `${keyPrefix}/${Date.now()}-${safeBase}.${safeExt}`;
  const contentType = file.type || `image/${safeExt}`;

  const { uploadUrl } = await uploadApi.getPresignUrl({
    key,
    contentType,
  });
  await uploadFileToPresignedUrl(uploadUrl, file, { contentType });
  return key;
}
