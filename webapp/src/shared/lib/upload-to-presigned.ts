/**
 * อัปโหลดไฟล์ไปยัง presigned PUT URL (MinIO/S3) โดยตรงจาก frontend
 * ใช้ร่วมกับ API POST /upload/presign ที่คืน uploadUrl
 */

export type UploadToPresignedOptions = {
  /** Content-Type ที่ส่งใน header PUT (ควรตรงกับที่ขอ presign) */
  contentType?: string;
};

/**
 * อัปโหลดไฟล์ไปยัง presigned URL ด้วย PUT
 * @param uploadUrl - URL จาก POST /upload/presign
 * @param file - ไฟล์ที่จะอัปโหลด
 * @param options - contentType (ควรตรงกับที่ใช้ตอนขอ presign)
 * @throws ถ้า response ไม่ ok
 */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  options?: UploadToPresignedOptions,
): Promise<void> {
  const headers: HeadersInit = {};
  const contentType = options?.contentType ?? file.type;
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Upload failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`,
    );
  }
}
