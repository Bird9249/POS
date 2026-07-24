import { ImagePlus, Trash2, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { resolveFileSrc } from "@/lib/api/file-url";
import { cn } from "@/lib/utils";
import { copy } from "./ui-copy";

type Props = {
  value: string;
  uploading?: boolean;
  disabled?: boolean;
  onPick: (file: File) => void;
  onClear: () => void;
  onError?: (message: string) => void;
};

export function ProductImageField({
  value,
  uploading = false,
  disabled = false,
  onPick,
  onClear,
  onError,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const wasUploading = useRef(false);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  // After upload succeeds, prefer the server key and drop the blob URL
  useEffect(() => {
    if (!value || !localPreview) return;
    URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
  }, [value, localPreview]);

  // Upload finished without a key — drop optimistic preview
  useEffect(() => {
    if (uploading) {
      wasUploading.current = true;
      return;
    }
    if (wasUploading.current && !value && localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    wasUploading.current = false;
  }, [uploading, value, localPreview]);

  const src = resolveFileSrc(value, localPreview);
  const busy = uploading || disabled;

  function openPicker() {
    if (busy) return;
    inputRef.current?.click();
  }

  function handleFiles(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError?.(copy.imageTypeError);
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    onPick(file);
  }

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>{copy.image}</FieldLabel>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          handleFiles(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={openPicker}
          aria-label={src ? copy.changeImage : copy.uploadImage}
          className={cn(
            "bg-muted/40 relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed outline-none",
            "hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-60",
            src ? "border-border border-solid" : "border-muted-foreground/30",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {src ? (
              <motion.img
                key={src}
                src={src}
                alt=""
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="size-full object-cover"
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground flex flex-col items-center gap-1 px-2"
              >
                <ImagePlus className="size-7" />
                <span className="text-[11px] font-medium">
                  {copy.uploadImage}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/70 backdrop-blur-[1px]">
              <Spinner className="size-6" />
              <span className="text-muted-foreground text-[10px]">
                {copy.uploading}
              </span>
            </div>
          ) : null}
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <FieldDescription className="text-pretty">
            {copy.imageHint}
          </FieldDescription>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={openPicker}
            >
              <Upload data-icon="inline-start" />
              {src ? copy.changeImage : copy.uploadImage}
            </Button>
            {src ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (localPreview) {
                    URL.revokeObjectURL(localPreview);
                    setLocalPreview(null);
                  }
                  onClear();
                }}
              >
                <Trash2 data-icon="inline-start" />
                {copy.removeImage}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Field>
  );
}
