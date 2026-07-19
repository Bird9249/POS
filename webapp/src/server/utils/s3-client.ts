import { env } from "@/server/platform/config";
import { S3Client } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

/**
 * S3 client สำหรับ MinIO/S3-compatible object store
 * ใช้ path-style และ custom endpoint ตาม env
 */
export function createS3Client(): S3Client {
  if (cachedClient) return cachedClient;

  const { S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION } = env;
  if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    throw new Error(
      "S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY must be set for S3/MinIO",
    );
  }

  cachedClient = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  return cachedClient;
}
