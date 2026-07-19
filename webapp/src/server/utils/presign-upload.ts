import { env } from "@/server/platform/config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client } from "./s3-client";

export type PresignUploadOptions = {
  /** Object key in bucket (path + filename) */
  key: string;
  /** Content-Type for upload (client should send same header when PUT) */
  contentType?: string;
  /** URL validity in seconds (default 900 = 15 min) */
  expiresIn?: number;
};

/**
 * สร้าง presigned PUT URL สำหรับอัปโหลดไฟล์จาก frontend ไปยัง MinIO/S3 โดยตรง
 * ใช้เมื่อ S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY ถูกตั้งค่า
 */
export async function getPresignedUploadUrl(
  options: PresignUploadOptions,
): Promise<{ uploadUrl: string; key: string } | null> {
  const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY } = env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    return null;
  }

  const client = createS3Client();
  const expiresIn = options.expiresIn ?? 900;
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: options.key,
    ...(options.contentType && { ContentType: options.contentType }),
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return { uploadUrl, key: options.key };
}
