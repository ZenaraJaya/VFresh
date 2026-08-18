'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { readImageFileAsJpeg } from '@/lib/read-image-file';

export default function ProofCapture({
  value,
  onChange,
  onMeta,
}: {
  value?: string;
  onChange: (dataUrl: string) => void;
  onMeta: (meta: { takenAt: string; lat?: number; lng?: number }) => void;
}) {
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await readImageFileAsJpeg(file, 960, 0.78);
      onChange(dataUrl);
      const takenAt = new Date().toISOString();
      if (!navigator.geolocation) {
        onMeta({ takenAt });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onMeta({
            takenAt,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => onMeta({ takenAt }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read photo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Photo proof</label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          void pick(file);
          e.target.value = '';
        }}
        className="w-full text-sm"
      />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Proof preview" className="max-h-40 rounded-lg object-cover" />
      ) : null}
      {value ? (
        <button
          type="button"
          className="text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.setAttribute('capture', 'environment');
            input.onchange = () => void pick(input.files?.[0]);
            input.click();
          }}
        >
          Retake photo
        </button>
      ) : null}
    </div>
  );
}
