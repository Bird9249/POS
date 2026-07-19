import { compressImageToWebP } from "@/shared/lib/image-compress";
import { uploadApi } from "@/shared/lib/upload-api";
import { uploadFileToPresignedUrl } from "@/shared/lib/upload-to-presigned";
import { AppImage } from "@/shared/ui/AppImage";
import { Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "image";
}

export type ImageKeyUploadFieldProps = {
  /** ค่า key ปัจจุบัน (จาก MinIO) */
  value: string;
  /** เมื่อมี key ใหม่หลังอัปโหลด หรือ "" เมื่อลบ */
  onChange: (key: string) => void;
  /** Prefix ของ key ใน bucket เช่น "uploads/cms/home-hero" */
  keyPrefix?: string;
  /** Label แสดงด้านบน */
  label?: string;
  /** คำใบ้ aspect ratio เช่น "4:5" */
  aspectHint?: string;
  disabled?: boolean;
  /** อัตราส่วนกล่อง preview (Tailwind เช่น aspect-square, aspect-video) */
  aspectRatio?: string;
  /** แสดงข้อความแนะนำขนาด (px) ให้ user เช่น "แนะนำ 400×300 px" */
  widthPx?: number;
  /** แสดงข้อความแนะนำขนาด (px) ให้ user ใช้คู่กับ widthPx */
  heightPx?: number;
  className?: string;
  /** true = ไม่อัปโหลดตอนเลือกไฟล์ เก็บไฟล์ไว้ แล้วเรียก onFileSelect; ต้องส่ง pendingFile กับ onClear */
  deferUpload?: boolean;
  /** ไฟล์ที่เลือกไว้ (ยังไม่อัปโหลด) ใช้กับ deferUpload */
  pendingFile?: File | null;
  /** เมื่อเลือกไฟล์ (deferUpload เท่านั้น) */
  onFileSelect?: (file: File) => void;
  /** เมื่อกดลบ (deferUpload เท่านั้น) ควรล้าง key + pending ใน parent */
  onClear?: () => void;
};

export function ImageKeyUploadField({
  value,
  onChange,
  keyPrefix = "uploads/cms",
  label = "ຮູບ",
  aspectHint,
  disabled = false,
  aspectRatio = "aspect-square",
  widthPx,
  heightPx,
  className = "",
  deferUpload = false,
  pendingFile = null,
  onFileSelect,
  onClear,
}: ImageKeyUploadFieldProps) {
  const inputId = useId();
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  );
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const uploadFile = useCallback(
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

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setError(null);
      setCompressing(true);
      let compressed: File;
      try {
        compressed = await compressImageToWebP(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ປະມວນຮູບລົ້ມເຫຼວ");
        setCompressing(false);
        return;
      } finally {
        setCompressing(false);
      }
      if (deferUpload && onFileSelect) {
        onFileSelect(compressed);
        return;
      }
      setUploading(true);
      try {
        const key = await uploadFile(compressed);
        onChange(key);
      } catch (err) {
        setError(err instanceof Error ? err.message : "ອັບໂຫຼດລົ້ມເຫຼວ");
      } finally {
        setUploading(false);
      }
    },
    [deferUpload, onFileSelect, uploadFile, onChange],
  );

  const handleClear = useCallback(() => {
    onChange("");
    setError(null);
    onClear?.();
  }, [onChange, onClear]);

  const hasImage = !!value?.trim() || !!pendingFile;
  // เมื่อมีไฟล์ใหม่ที่เลือกไว้ (ยังไม่อัปโหลด) ให้แสดง preview ไฟล์ใหม่ แทนรูปเดิม
  const previewSrc = pendingFile ? previewUrl : value?.trim() || null;

  const sizeHintText =
    widthPx != null && heightPx != null
      ? `ແນະນຳ ${widthPx}×${heightPx} px`
      : widthPx != null
        ? `ແນະນຳ ${widthPx} px ກວ້າງ`
        : heightPx != null
          ? `ແນະນຳ ${heightPx} px ສູງ`
          : null;

  return (
    <div className={className}>
      {label && <span className="mb-1 block font-medium text-sm">{label}</span>}
      {aspectHint && (
        <p className="mb-1 text-muted-foreground text-xs">{aspectHint}</p>
      )}
      {sizeHintText && (
        <p className="mb-1 text-muted-foreground text-xs">{sizeHintText}</p>
      )}
      <div className={`flex w-full flex-col gap-2 ${aspectRatio} min-h-24`}>
        {hasImage ? (
          <div className="relative min-h-32 flex-1 overflow-hidden rounded-lg border bg-muted/20">
            {previewSrc?.startsWith("blob:") ? (
              <img
                src={previewSrc}
                alt={label}
                className="size-full object-cover"
              />
            ) : (
              <AppImage
                src={previewSrc}
                alt={label}
                className="size-full"
                fit="cover"
              />
            )}
            {pendingFile && (
              <span className="absolute top-2 left-2 rounded bg-amber-500/90 px-2 py-0.5 text-white text-xs">
                ຍັງບໍ່ອັບໂຫຼດ (ຈະອັບໂຫຼດເມື່ອບັນທຶກ)
              </span>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <input
                type="file"
                accept="image/*"
                id={inputId}
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || compressing || uploading}
              />
              <label
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-1 rounded bg-background/90 px-2 py-1.5 text-xs shadow hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="ແກ້ຮູບ"
              >
                {compressing || uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {compressing
                  ? "ກຳລັງປະມວນຮູບ..."
                  : uploading
                    ? "ກຳລັງອັບ..."
                    : "ແກ້"}
              </label>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="flex items-center gap-1 rounded bg-background/90 px-2 py-1.5 text-xs shadow hover:bg-background disabled:opacity-50"
                aria-label="ລຶບຮູບ"
              >
                <Trash2 className="size-3.5" />
                ລຶບ
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-32 flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/10 p-4">
            <input
              type="file"
              accept="image/*"
              id={inputId}
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || compressing || uploading}
            />
            <label
              htmlFor={inputId}
              className="flex cursor-pointer flex-col items-center gap-1 text-center disabled:cursor-not-allowed disabled:opacity-50"
            >
              {compressing || uploading ? (
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="size-8 text-muted-foreground" />
              )}
              <span className="text-muted-foreground text-sm">
                {compressing
                  ? "ກຳລັງປະມວນຮູບ..."
                  : uploading
                    ? "ກຳລັງອັບໂຫຼດ..."
                    : "ເລືອກຮູບ"}
              </span>
            </label>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
