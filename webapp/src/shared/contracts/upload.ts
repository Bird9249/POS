import { z } from "zod";

/** Request body สำหรับขอ presigned upload URL */
export const PresignUploadSchema = z.object({
  /** Object key ใน bucket (path + filename) เช่น uploads/images/xxx.jpg */
  key: z.string().min(1, "key is required"),
  /** Content-Type ที่จะใช้ตอน PUT (optional) */
  contentType: z.string().optional(),
  /** อายุ URL เป็นวินาที (optional, default 900) */
  expiresIn: z.coerce.number().min(60).max(86400).optional(),
});

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;

/** Multipart: เริ่ม upload (ได้ uploadId) */
export const MultipartInitSchema = z.object({
  key: z.string().min(1, "key is required"),
  contentType: z.string().optional(),
});

export type MultipartInitInput = z.infer<typeof MultipartInitSchema>;

/** Multipart: ขอ presigned URL สำหรับแต่ละ part */
export const MultipartPresignPartsSchema = z.object({
  key: z.string().min(1, "key is required"),
  uploadId: z.string().min(1, "uploadId is required"),
  partNumbers: z.array(z.coerce.number().min(1).max(10_000)),
  expiresIn: z.coerce.number().min(60).max(86400).optional(),
});

export type MultipartPresignPartsInput = z.infer<
  typeof MultipartPresignPartsSchema
>;

/** Multipart: รวม parts เป็น object (complete) */
export const MultipartCompleteSchema = z.object({
  key: z.string().min(1, "key is required"),
  uploadId: z.string().min(1, "uploadId is required"),
  parts: z.array(
    z.object({
      partNumber: z.coerce.number().min(1).max(10_000),
      etag: z.string().min(1, "etag is required"),
    }),
  ),
});

export type MultipartCompleteInput = z.infer<typeof MultipartCompleteSchema>;

/** Multipart: ยกเลิก upload */
export const MultipartAbortSchema = z.object({
  key: z.string().min(1, "key is required"),
  uploadId: z.string().min(1, "uploadId is required"),
});

export type MultipartAbortInput = z.infer<typeof MultipartAbortSchema>;
