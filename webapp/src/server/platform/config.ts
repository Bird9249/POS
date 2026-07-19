import { z } from "zod";

const Env = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z
    .string()
    .min(1, "CORS_ORIGIN is required")
    .default("http://localhost:3000"),

  /** S3-compatible object store (MinIO) endpoint, e.g. http://localhost:9000 */
  S3_ENDPOINT: z.string().url().optional(),
  /** Bucket name for uploads */
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  /** Region for signing (MinIO often uses us-east-1) */
  S3_REGION: z.string().default("us-east-1"),
});

export type Env = z.infer<typeof Env>;
export const env: Env = Env.parse(process.env);
