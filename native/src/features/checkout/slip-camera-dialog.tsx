import { Camera, SwitchCamera } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  onCapture: (file: File) => void;
};

type CameraDevice = {
  deviceId: string;
  label: string;
};

function stopVideoTracks(video: HTMLVideoElement | null) {
  const stream = video?.srcObject;
  if (stream instanceof MediaStream) {
    for (const track of stream.getTracks()) track.stop();
  }
  if (video) video.srcObject = null;
}

function pickInitialIndex(devices: CameraDevice[]) {
  const back = devices.findIndex((d) =>
    /back|rear|environment|ຫຼັງ|หลัง/i.test(d.label),
  );
  return back >= 0 ? back : 0;
}

function mapMediaError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return copy.slipPermissionDenied;
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return copy.slipNoCamera;
  }
  return copy.slipCameraError;
}

export function SlipCameraDialog({ open, onOpenChange, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);

  // Enumerate cameras when dialog opens
  useEffect(() => {
    if (!open) {
      setDevices([]);
      setDeviceIndex(0);
      setError(null);
      setCapturing(false);
      return;
    }

    let cancelled = false;

    async function loadDevices() {
      setStarting(true);
      setError(null);
      try {
        const warm = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        for (const track of warm.getTracks()) track.stop();

        const listed = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const cams = listed
          .filter((d) => d.kind === "videoinput" && d.deviceId)
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label?.trim() || `Camera ${i + 1}`,
          }));
        if (cams.length === 0) {
          setDevices([]);
          setError(copy.slipNoCamera);
          setStarting(false);
          return;
        }
        setDevices(cams);
        setDeviceIndex(pickInitialIndex(cams));
      } catch (err) {
        if (cancelled) return;
        setError(mapMediaError(err));
        setStarting(false);
      }
    }

    void loadDevices();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Start live preview for selected device
  useEffect(() => {
    if (!open || devices.length === 0) return;
    const deviceId = devices[deviceIndex]?.deviceId;
    if (!deviceId) return;

    let cancelled = false;
    setStarting(true);
    setReady(false);
    setError(null);

    async function start() {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const video = videoRef.current;
      if (!video || cancelled) return;

      try {
        stopVideoTracks(video);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) setError(mapMediaError(err));
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopVideoTracks(videoRef.current);
    };
  }, [open, devices, deviceIndex]);

  const canSwitch = devices.length > 1 && !starting && !error && !capturing;
  const canShoot = ready && !starting && !error && !capturing;

  async function shoot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturing) return;

    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError(copy.slipCameraError);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob) {
        setError(copy.slipCameraError);
        return;
      }

      stopVideoTracks(video);
      const file = new File([blob], `slip-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      onCapture(file);
      onOpenChange(false);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-70 max-w-md gap-3 sm:max-w-md"
        overlayClassName="z-60"
      >
        <DialogHeader>
          <DialogTitle>{copy.captureSlip}</DialogTitle>
          <DialogDescription>{copy.slipCameraHint}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted relative aspect-3/4 overflow-hidden rounded-lg">
          <video
            ref={videoRef}
            className="size-full object-cover"
            muted
            playsInline
            autoPlay
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border-primary/80 h-[72%] w-[82%] rounded-md border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>

          {canSwitch ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 bottom-2 z-10 size-10 shadow-md"
              aria-label={copy.switchCamera}
              title={copy.switchCamera}
              onClick={() => setDeviceIndex((i) => (i + 1) % devices.length)}
            >
              <SwitchCamera className="size-5" />
            </Button>
          ) : null}

          <AnimatePresence>
            {starting || capturing ? (
              <motion.div
                className="bg-background/70 absolute inset-0 flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Spinner />
                <span className="text-sm">
                  {capturing ? copy.slipShutter : copy.slipCameraStarting}
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base"
            disabled={!canShoot}
            onClick={() => void shoot()}
          >
            <Camera data-icon="inline-start" />
            {copy.slipShutter}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
