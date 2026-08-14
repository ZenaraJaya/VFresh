'use client';

import { useEffect, useRef, useState } from 'react';
import { parseScannedOrderNumber } from '@/lib/order-scan';

export default function QrScanner({
  onCode,
}: {
  onCode: (orderNumber: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;

    const Detector =
      typeof window !== 'undefined'
        ? (
            window as unknown as {
              BarcodeDetector?: new (opts: { formats: string[] }) => {
                detect: (src: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
              };
            }
          ).BarcodeDetector
        : undefined;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if (!Detector) {
          setError('This browser cannot scan QR. Use the phone Camera app on the code, or type the order number.');
          return;
        }

        const detector = new Detector({ formats: ['qr_code'] });
        timer = setInterval(async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue;
            if (!raw) return;
            const num = parseScannedOrderNumber(raw);
            if (num) {
              stopped = true;
              onCode(num);
              setRunning(false);
            }
          } catch {
            // keep scanning
          }
        }, 400);
      } catch {
        setError('Camera permission is needed to scan.');
        setRunning(false);
      }
    };

    void start();
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [running, onCode]);

  return (
    <div className="space-y-2">
      {!running ? (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRunning(true);
          }}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
        >
          Scan order QR
        </button>
      ) : (
        <div className="space-y-2">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-square w-full rounded-xl bg-black object-cover"
          />
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-700"
          >
            Close camera
          </button>
        </div>
      )}
      {error && <p className="text-xs text-amber-800">{error}</p>}
    </div>
  );
}
