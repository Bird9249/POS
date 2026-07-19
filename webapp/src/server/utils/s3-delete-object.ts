import { env } from "@/server/platform/config";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client } from "./s3-client";

/**
 * ลบ object จาก MinIO/S3 ตาม key
 * คืน true ถ้าลบได้หรือ S3 ไม่ได้ config (no-op), false ถ้า error
 */
export async function deleteObjectFromS3(key: string): Promise<boolean> {
  const bucket = env.S3_BUCKET;
  if (!env.S3_ENDPOINT || !bucket || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
    return true; // no-op when S3 not configured
  }

  try {
    const client = createS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
