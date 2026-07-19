import { uploadApi } from "@/shared/lib/upload-api";
import { uploadFileToPresignedUrl } from "@/shared/lib/upload-to-presigned";
import { Loader2, Plus, Upload } from "lucide-react";
import { useCallback, useId, useState } from "react";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "image";
}

export type PresignedImageUploadTriggerProps = {
  /** Prefix ของ key ใน bucket เช่น "uploads/products" */
  keyPrefix?: string;
  /** เมื่ออัปโหลดสำเร็จ 1 ไฟล์ */
  onSuccess?: (key: string) => void;
  /** เมื่ออัปโหลดหลายไฟล์สำเร็จ (เลือก multiple แล้วอัปโหลดครบ) */
  onSuccessMultiple?: (keys: string[]) => void;
  onError?: (error: Error) => void;
  /** รูปแบบ: ปุ่มในแถบเครื่องมือ หรือช่องใน grid */
  variant?: "button" | "tile";
  /** ข้อความปุ่ม (ใช้เมื่อ variant="button") */
  label?: string;
  /** ให้เลือกหลายรูปได้ */
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
};

export function PresignedImageUploadTrigger({
  keyPrefix = "uploads/products",
  onSuccess,
  onSuccessMultiple,
  onError,
  variant = "button",
  label = "ອັບໂຫຼດຮູບ",
  multiple = false,
  disabled = false,
  className = "",
}: PresignedImageUploadTriggerProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadOneFile = useCallback(
    async (file: File): Promise<string> => {
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      const safeExt = /^(jpe?g|png|gif|webp)$/.test(ext) ? ext : "jpg";
      const baseName = file.name.includes(".")
        ? file.name.slice(0, file.name.lastIndexOf("."))
        : file.name;
      const safeBase = sanitizeFilename(baseName);
      const key = `${keyPrefix}/${Date.now()}-${safeBase}.${safeExt}`;
      const contentType = file.type || `image/${safeExt}`;

      const { uploadUrl } = await uploadApi.getPresignUrl({
        key,
        contentType,
      });
      await uploadFileToPresignedUrl(uploadUrl, file, { contentType });
      return key;
    },
    [keyPrefix],
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      const files = fileList ? Array.from(fileList) : [];
      e.target.value = "";

      if (!files.length) return;
      setError(null);
      setUploading(true);

      try {
        const keys: string[] = [];
        for (const file of files) {
          const key = await uploadOneFile(file);
          keys.push(key);
        }
        const firstKey = keys[0];
        if (keys.length === 1 && firstKey !== undefined) {
          onSuccess?.(firstKey);
        } else if (keys.length > 1 && onSuccessMultiple) {
          onSuccessMultiple(keys);
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err.message);
        onError?.(err);
      } finally {
        setUploading(false);
      }
    },
    [uploadOneFile, onSuccess, onSuccessMultiple, onError],
  );

  const triggerClick = useCallback(() => {
    if (disabled || uploading) return;
    document.getElementById(inputId)?.click();
  }, [inputId, disabled, uploading]);

  const isTile = variant === "tile";

  return (
    <div className={className}>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled || uploading}
        className="hidden"
        id={inputId}
        aria-label={label}
      />
      {isTile ? (
        <button
          type="button"
          onClick={triggerClick}
          disabled={disabled || uploading}
          className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/10 px-6 py-2 transition-colors hover:border-primary/50 hover:bg-muted/20 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            <Plus className="size-8 text-muted-foreground" />
          )}
          <span className="text-muted-foreground text-xs">
            {uploading ? "ກຳລັງອັບໂຫຼດ..." : "ເພີ່ມຮູບ"}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={triggerClick}
          disabled={disabled || uploading}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 font-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-4 shrink-0 animate-spin" />
          ) : (
            <Upload className="size-4 shrink-0" />
          )}
          <span>{uploading ? "ກຳລັງອັບໂຫຼດ..." : label}</span>
        </button>
      )}
      {error && (
        <p className="mt-1.5 text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
