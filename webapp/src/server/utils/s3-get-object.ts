import { env } from "@/server/platform/config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client } from "./s3-client";

export type S3GetObjectResult = {
  body: ReadableStream<Uint8Array> | Blob;
  contentType?: string;
  contentLength?: number;
};

/**
 * ดึง object จาก MinIO/S3 ตาม key
 * คืน body (stream) และ Content-Type สำหรับ stream ไปยัง client
 * ถ้า S3 ไม่ได้ config หรือ key ไม่มี จะ return null
 */
export async function getObjectFromS3(
  key: string,
): Promise<S3GetObjectResult | null> {
  const { S3_BUCKET } = env;
  if (!S3_BUCKET) return null;

  try {
    const client = createS3Client();
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await client.send(command);
    const body = response.Body;
    if (!body) return null;

    // AWS SDK v3 Body: ใช้ transformToWebStream() ถ้ามี เพื่อให้ได้ Web ReadableStream สำหรับ Response
    const stream =
      typeof (body as { transformToWebStream?: () => ReadableStream })
        .transformToWebStream === "function"
        ? (
            body as { transformToWebStream: () => ReadableStream }
          ).transformToWebStream()
        : (body as ReadableStream<Uint8Array>);

    return {
      body: stream as ReadableStream<Uint8Array>,
      contentType: response.ContentType ?? undefined,
      contentLength: response.ContentLength ?? undefined,
    };
  } catch {
    return null;
  }
}
