import { BrowserCodeReader, BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from "@zxing/library";
import { SwitchCamera } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { copy } from "./ui-copy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
};

type CameraDevice = {
  deviceId: string;
  label: string;
};

function createReader() {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.QR_CODE,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
}

function pickInitialIndex(devices: CameraDevice[]) {
  const back = devices.findIndex((d) =>
    /back|rear|environment|หลัง|ຫຼັງ/i.test(d.label),
  );
  return back >= 0 ? back : 0;
}

function stopVideoTracks(video: HTMLVideoElement | null) {
  const stream = video?.srcObject;
  if (stream instanceof MediaStream) {
    for (const track of stream.getTracks()) track.stop();
  }
  if (video) video.srcObject = null;
}

export function BarcodeScanDialog({ open, onOpenChange, onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handledRef = useRef(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);

  const handleScan = useEffectEvent((value: string) => {
    onScan(value);
  });

  const handleOpenChange = useEffectEvent((next: boolean) => {
    onOpenChange(next);
  });

  // Reset camera selection whenever the dialog opens
  useEffect(() => {
    if (!open) {
      setDevices([]);
      setDeviceIndex(0);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadDevices() {
      setStarting(true);
      setError(null);
      try {
        // Warm permission so enumerateDevices returns labeled cameras
        const warm = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        for (const track of warm.getTracks()) track.stop();

        const listed = await BrowserCodeReader.listVideoInputDevices();
        if (cancelled) return;
        const cams = listed
          .filter((d) => d.deviceId)
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label?.trim() || `Camera ${i + 1}`,
          }));
        if (cams.length === 0) {
          setDevices([]);
          setError(copy.scanNoCamera);
          setStarting(false);
          return;
        }
        setDevices(cams);
        setDeviceIndex(pickInitialIndex(cams));
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError(copy.scanPermissionDenied);
        } else if (
          name === "NotFoundError" ||
          name === "DevicesNotFoundError"
        ) {
          setError(copy.scanNoCamera);
        } else {
          setError(copy.scanError);
        }
        setStarting(false);
      }
    }

    void loadDevices();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Start / restart decoder when selected device changes
  useEffect(() => {
    if (!open || devices.length === 0) return;

    const deviceId = devices[deviceIndex]?.deviceId;
    if (!deviceId) return;

    handledRef.current = false;
    setError(null);
    setStarting(true);

    const reader = createReader();
    let controls: { stop: () => void } | null = null;
    let cancelled = false;

    async function start() {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      const video = videoRef.current;
      if (!video || cancelled) return;

      try {
        controls = await reader.decodeFromVideoDevice(
          deviceId,
          video,
          (result, err) => {
            if (cancelled || handledRef.current) return;
            if (result) {
              const text = result.getText().trim();
              if (!text) return;
              handledRef.current = true;
              controls?.stop();
              handleScan(text);
              handleOpenChange(false);
              return;
            }
            if (err && !(err instanceof NotFoundException)) {
              // Continuous decode misses are expected.
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError(copy.scanPermissionDenied);
        } else if (
          name === "NotFoundError" ||
          name === "DevicesNotFoundError"
        ) {
          setError(copy.scanNoCamera);
        } else {
          setError(copy.scanError);
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    void start();

    return () => {
      cancelled = true;
      controls?.stop();
      stopVideoTracks(videoRef.current);
    };
  }, [open, devices, deviceIndex]);

  const canSwitch = devices.length > 1 && !starting && !error;

  function switchCamera() {
    if (devices.length < 2) return;
    setDeviceIndex((i) => (i + 1) % devices.length);
  }

  const activeLabel = devices[deviceIndex]?.label;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-70 max-w-md gap-3 sm:max-w-md"
        overlayClassName="z-60"
      >
        <DialogHeader>
          <DialogTitle>{copy.scanTitle}</DialogTitle>
          <DialogDescription>{copy.scanHint}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted relative aspect-4/3 overflow-hidden rounded-lg">
          <video
            ref={videoRef}
            className="size-full object-cover"
            muted
            playsInline
            autoPlay
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border-primary/80 h-24 w-[78%] rounded-md border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>

          {canSwitch ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 bottom-2 z-10 size-10 shadow-md"
              aria-label={copy.switchCamera}
              title={copy.switchCamera}
              onClick={switchCamera}
            >
              <SwitchCamera className="size-5" />
            </Button>
          ) : null}

          <AnimatePresence>
            {starting ? (
              <motion.div
                className="bg-background/70 absolute inset-0 flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Spinner />
                <span className="text-sm">{copy.scanStarting}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {activeLabel && devices.length > 1 && !error ? (
          <p className="text-muted-foreground truncate text-center text-xs">
            {activeLabel}
            <span className="text-muted-foreground/70">
              {" "}
              ({deviceIndex + 1}/{devices.length})
            </span>
          </p>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          {devices.length > 1 ? (
            <Button
              type="button"
              variant="secondary"
              disabled={!canSwitch}
              onClick={switchCamera}
            >
              <SwitchCamera />
              {copy.switchCamera}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
