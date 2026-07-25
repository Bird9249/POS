import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Banknote, Camera, QrCode, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { resolveFileSrc } from "@/lib/api/file-url";
import { uploadSaleSlip } from "@/lib/api/upload";
import { getLocalDb } from "@/lib/db/client";
import { formatKip } from "@/lib/format-kip";
import { loadReceiptSettings } from "@/lib/sync/pull-settings";
import { cn } from "@/lib/utils";
import { computeCashChange, validateTransferPayment } from "./payment";
import { SlipCameraDialog } from "./slip-camera-dialog";
import { copy } from "./ui-copy";

export type PaymentMethod = "cash" | "transfer";

export type CompletedPayment =
  | {
      method: "cash";
      amountDue: number;
      amountReceived: number;
      changeAmount: number;
    }
  | {
      method: "transfer";
      amountDue: number;
      confirmedByStaff: true;
      slipImageKey: string;
    };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountDue: number;
  onComplete: (payment: CompletedPayment) => void;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"] as const;

export function PaySheet({ open, onOpenChange, amountDue, onComplete }: Props) {
  const [step, setStep] = useState<"method" | "cash" | "transfer">("method");
  const [receivedDigits, setReceivedDigits] = useState("");
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipKey, setSlipKey] = useState<string | null>(null);
  const [slipUploading, setSlipUploading] = useState(false);
  const [slipCameraOpen, setSlipCameraOpen] = useState(false);

  const storeSettings = useQuery({
    queryKey: ["receipt-settings-pay"],
    queryFn: async () => loadReceiptSettings(await getLocalDb()),
    enabled: open,
    staleTime: 30_000,
  });
  const qrSrc = resolveFileSrc(storeSettings.data?.qrImageKey);
  const bankName =
    storeSettings.data?.bankName?.trim() || copy.bankPlaceholder;
  const bankAccount =
    storeSettings.data?.bankAccount?.trim() || copy.accountPlaceholder;

  useEffect(() => {
    if (!open) return;
    setStep("method");
    setReceivedDigits("");
    setSlipKey(null);
    setSlipUploading(false);
    setSlipCameraOpen(false);
    setSlipPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [open, amountDue]);

  useEffect(() => {
    return () => {
      if (slipPreview) URL.revokeObjectURL(slipPreview);
    };
  }, [slipPreview]);

  const received = receivedDigits === "" ? 0 : Number.parseInt(receivedDigits, 10) || 0;
  const cash = computeCashChange({ amountDue, amountReceived: received });
  const transferOk = validateTransferPayment({
    confirmedByStaff: true,
    slipImageKey: slipKey,
  }).ok;

  function pressKey(key: (typeof KEYS)[number]) {
    if (key === "⌫") {
      setReceivedDigits((d) => d.slice(0, -1));
      return;
    }
    setReceivedDigits((d) => {
      const next = d + key;
      if (next.length > 12) return d;
      return next.replace(/^0+(?=\d)/, "");
    });
  }

  function clearSlip() {
    setSlipPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSlipKey(null);
  }

  async function onPickSlip(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(copy.slipTypeError);
      return;
    }

    const preview = URL.createObjectURL(file);
    setSlipPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return preview;
    });
    setSlipKey(null);
    setSlipUploading(true);
    try {
      const key = await uploadSaleSlip(file);
      if (!key) {
        toast.error(copy.slipUploadError);
        clearSlip();
        return;
      }
      setSlipKey(key);
      toast.success(copy.slipAttached);
    } finally {
      setSlipUploading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
            <SheetTitle className="text-lg">{copy.payTitle}</SheetTitle>
            <SheetDescription>
              {copy.amountDue} · {formatKip(amountDue)}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <AnimatePresence mode="wait">
              {step === "method" ? (
                <motion.div
                  key="method"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-3"
                >
                  <div className="from-muted/70 to-background rounded-2xl bg-linear-to-br p-5 text-center ring-1 ring-foreground/8">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {copy.amountDue}
                    </p>
                    <p className="font-heading mt-1 text-4xl font-semibold tabular-nums">
                      {formatKip(amountDue)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 w-full justify-start gap-3 rounded-2xl px-4 text-base"
                    onClick={() => setStep("cash")}
                  >
                    <Banknote className="size-6 text-emerald-600" />
                    {copy.cash}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-16 w-full justify-start gap-3 rounded-2xl px-4 text-base"
                    onClick={() => setStep("transfer")}
                  >
                    <QrCode className="size-6 text-sky-600" />
                    {copy.transfer}
                  </Button>
                </motion.div>
              ) : null}

              {step === "cash" ? (
                <motion.div
                  key="cash"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-muted/40 p-3 ring-1 ring-foreground/8">
                      <p className="text-muted-foreground text-[11px] uppercase">
                        {copy.amountDue}
                      </p>
                      <p className="font-heading mt-1 text-xl font-semibold tabular-nums">
                        {formatKip(amountDue)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 p-3 ring-1 ring-foreground/8">
                      <p className="text-muted-foreground text-[11px] uppercase">
                        {copy.change}
                      </p>
                      <p
                        className={cn(
                          "font-heading mt-1 text-xl font-semibold tabular-nums",
                          cash.ok
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-destructive",
                        )}
                      >
                        {cash.ok ? formatKip(cash.changeAmount) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl p-4 text-center ring-1 ring-foreground/10">
                    <p className="text-muted-foreground text-xs">{copy.amountReceived}</p>
                    <p className="font-heading mt-1 text-4xl font-semibold tabular-nums">
                      {formatKip(received)}
                    </p>
                    {!cash.ok && received > 0 ? (
                      <p className="text-destructive mt-2 text-sm">{copy.insufficient}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {KEYS.map((key) => (
                      <Button
                        key={key}
                        type="button"
                        variant="outline"
                        className="h-14 rounded-xl text-xl font-semibold"
                        onClick={() => pressKey(key)}
                      >
                        {key}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {step === "transfer" ? (
                <motion.div
                  key="transfer"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <div className="from-muted/70 to-background rounded-2xl bg-linear-to-br p-5 text-center ring-1 ring-foreground/8">
                    <p className="text-muted-foreground text-xs uppercase">{copy.amountDue}</p>
                    <p className="font-heading mt-1 text-3xl font-semibold tabular-nums">
                      {formatKip(amountDue)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-6">
                    <div className="bg-muted flex size-40 items-center justify-center overflow-hidden rounded-xl">
                      {qrSrc ? (
                        <img
                          src={qrSrc}
                          alt="QR"
                          className="size-full object-contain p-2"
                        />
                      ) : (
                        <QrCode className="text-muted-foreground size-20 opacity-40" />
                      )}
                    </div>
                    {!qrSrc ? (
                      <p className="text-muted-foreground max-w-xs text-center text-sm text-pretty">
                        {copy.qrPlaceholder}
                      </p>
                    ) : null}
                    <div className="text-center text-sm">
                      <p className="font-medium">{bankName}</p>
                      <p className="text-muted-foreground">{bankAccount}</p>
                    </div>
                    <p className="text-muted-foreground text-xs text-pretty">
                      {copy.transferHint}
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-foreground/8">
                    <p className="text-sm font-semibold">{copy.captureSlip}</p>

                    {slipPreview ? (
                      <div className="relative overflow-hidden rounded-xl ring-1 ring-foreground/10">
                        <img
                          src={slipPreview}
                          alt=""
                          className="max-h-56 w-full object-contain bg-background"
                        />
                        {slipUploading ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-[1px]">
                            <Spinner className="size-7" />
                            <span className="text-muted-foreground text-xs">
                              {copy.slipUploading}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 flex-1 rounded-xl"
                        disabled={slipUploading}
                        onClick={() => setSlipCameraOpen(true)}
                      >
                        <Camera data-icon="inline-start" />
                        {slipPreview ? copy.retakeSlip : copy.captureSlip}
                      </Button>
                      {slipPreview ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-12 shrink-0 rounded-xl"
                          disabled={slipUploading}
                          onClick={clearSlip}
                          aria-label={copy.remove}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      ) : null}
                    </div>

                    {!slipKey && !slipUploading ? (
                      <p className="text-muted-foreground text-xs">
                        {copy.slipRequired}
                      </p>
                    ) : null}
                    {slipKey && !slipUploading ? (
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        {copy.slipAttached}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <SheetFooter className="bg-background/95 shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                onClick={() => {
                  if (step === "method") onOpenChange(false);
                  else setStep("method");
                }}
              >
                {step === "method" ? copy.cancel : "←"}
              </Button>
              {step === "cash" ? (
                <Button
                  type="button"
                  className="h-12 flex-[1.6] rounded-xl"
                  disabled={!cash.ok}
                  onClick={() => {
                    if (!cash.ok) return;
                    onComplete({
                      method: "cash",
                      amountDue,
                      amountReceived: received,
                      changeAmount: cash.changeAmount,
                    });
                  }}
                >
                  {copy.confirmCash}
                </Button>
              ) : null}
              {step === "transfer" ? (
                <Button
                  type="button"
                  className="h-12 flex-[1.6] rounded-xl"
                  disabled={!transferOk || slipUploading}
                  onClick={() => {
                    const v = validateTransferPayment({
                      confirmedByStaff: true,
                      slipImageKey: slipKey,
                    });
                    if (!v.ok || !slipKey) {
                      toast.error(copy.slipRequired);
                      return;
                    }
                    onComplete({
                      method: "transfer",
                      amountDue,
                      confirmedByStaff: true,
                      slipImageKey: slipKey,
                    });
                  }}
                >
                  {copy.confirmTransfer}
                </Button>
              ) : null}
            </div>
          </SheetFooter>
        </motion.div>
      </SheetContent>

      <SlipCameraDialog
        open={slipCameraOpen}
        onOpenChange={setSlipCameraOpen}
        onCapture={(file) => void onPickSlip(file)}
      />
    </Sheet>
  );
}
