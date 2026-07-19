import { fetcher } from "@/shared/lib/fetcher";
import { config } from "./config";

export type PresignUploadResponse = {
  uploadUrl: string;
  key: string;
};

export type PresignUploadInput = {
  key: string;
  contentType?: string;
  expiresIn?: number;
};

export type MultipartInitResponse = { uploadId: string; key: string };
export type MultipartPresignPartsResponse = {
  parts: { partNumber: number; uploadUrl: string }[];
};
export type MultipartCompleteResponse = { key: string };

const baseUrl = `${config.apiUrl}/upload`;

export const uploadApi = {
  /** ขอ presigned PUT URL จาก backend สำหรับอัปโหลดไป MinIO โดยตรง */
  getPresignUrl: (input: PresignUploadInput) =>
    fetcher.post<PresignUploadResponse>(`${baseUrl}/presign`, input),

  /** Multipart: เริ่ม upload ได้ uploadId */
  multipartInit: (input: { key: string; contentType?: string }) =>
    fetcher.post<MultipartInitResponse>(`${baseUrl}/multipart/init`, input),

  /** Multipart: ขอ presigned URL สำหรับแต่ละ part */
  multipartPresignParts: (input: {
    key: string;
    uploadId: string;
    partNumbers: number[];
    expiresIn?: number;
  }) =>
    fetcher.post<MultipartPresignPartsResponse>(
      `${baseUrl}/multipart/presign-parts`,
      input,
    ),

  /** Multipart: รวม parts เป็น object */
  multipartComplete: (input: {
    key: string;
    uploadId: string;
    parts: { partNumber: number; etag: string }[];
  }) =>
    fetcher.post<MultipartCompleteResponse>(
      `${baseUrl}/multipart/complete`,
      input,
    ),

  /** Multipart: ยกเลิก upload */
  multipartAbort: (input: { key: string; uploadId: string }) =>
    fetcher.post<{ ok: true }>(`${baseUrl}/multipart/abort`, input),
};
