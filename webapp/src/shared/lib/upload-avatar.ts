import { uploadApi } from "@/shared/lib/upload-api";
import { uploadFileToPresignedUrl } from "@/shared/lib/upload-to-presigned";

const KEY_PREFIX = "uploads/avatars";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "avatar";
}

/**
 * อัปโหลดไฟล์รูป avatar ไป S3 ผ่าน presigned URL
 * คืน key ที่บันทึกใน object store (สำหรับส่งไปบันทึกใน DB)
 */
export async function uploadAvatarFile(file: File): Promise<string> {
  const ext = file.name.includes(".")
    ? (file.name.split(".").pop() ?? "").toLowerCase()
    : "";
  const safeExt = /^(jpe?g|png|gif|webp)$/.test(ext) ? ext : "jpg";
  const key = `${KEY_PREFIX}/${Date.now()}-${sanitizeFilename(file.name.replace(/\.[^.]+$/, "") || "avatar")}.${safeExt}`;
  const contentType = file.type || `image/${safeExt}`;

  const { uploadUrl } = await uploadApi.getPresignUrl({
    key,
    contentType,
  });
  await uploadFileToPresignedUrl(uploadUrl, file, { contentType });
  return key;
}
