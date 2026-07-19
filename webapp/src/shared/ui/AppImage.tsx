import { ImageIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { config } from "../lib/config";

/**
 * แปลงค่า src จาก DB เป็น URL สำหรับแสดงรูป
 * - key (MinIO): uploads/xxx.jpg → config.filesUrl(key)
 * - path (local): /public/uploads/xxx → config.apiUrl + path
 * - full URL: ใช้ตามที่ส่งมา
 */
export function resolveImageSrc(src: string | null | undefined): string | null {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  const s = src.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return config.apiUrl + s;
  return config.apiUrl + "/files/" + s;
}

export type AppImageProps = {
  /** Key ใน MinIO, path เช่น /public/..., หรือ full URL */
  src: string | null | undefined;
  alt?: string;
  className?: string;
  /** object-fit ค่า default "cover" */
  fit?: "cover" | "contain" | "fill" | "none";
  /** รูป fallback เมื่อโหลดไม่สำเร็จหรือไม่มี src */
  fallback?: React.ReactNode;
  /** แสดง skeleton ระหว่างโหลด */
  showLoading?: boolean;
};

const fitClass: Record<NonNullable<AppImageProps["fit"]>, string> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
};

export function AppImage({
  src,
  alt = "",
  className,
  fit = "cover",
  fallback,
  showLoading = true,
}: AppImageProps) {
  const fitClassName = fitClass[fit];
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const resolvedSrc = useMemo(() => resolveImageSrc(src), [src]);

  const showFallback = !resolvedSrc || error;
  const defaultFallback = (
    <div
      className="flex size-full items-center justify-center rounded bg-muted text-muted-foreground"
      aria-hidden
    >
      <ImageIcon className="h-8 w-8" />
    </div>
  );

  if (showFallback) {
    return <div className={className}>{fallback ?? defaultFallback}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {showLoading && !loaded && (
        <div
          className="absolute inset-0 animate-pulse rounded bg-muted"
          aria-hidden
        />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        className={`size-full ${fitClassName} transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => {
          setLoaded(true);
          setError(false);
        }}
        onError={() => setError(true)}
      />
    </div>
  );
}
