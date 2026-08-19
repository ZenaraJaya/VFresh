'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { formatCoords } from '@/lib/maps';

export default function ConfirmAddressDialog({
  open,
  address,
  lat,
  lng,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  address: string;
  lat: number;
  lng: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-address-title"
        className="relative w-full max-w-md rounded-2xl border-2 border-emerald-400 bg-[#ecf8f1] p-5 text-neutral-900 shadow-2xl dark:border-emerald-400 dark:bg-[#163528] dark:text-emerald-50"
      >
        <h2 id="confirm-address-title" className="text-lg font-semibold">
          Please confirm this delivery address
        </h2>
        <p className="mt-2 text-sm leading-relaxed">
          {address.trim() || 'Add the floor and unit in the address field.'}
        </p>
        <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">
          Pin: {formatCoords(lat, lng)}
        </p>
        <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/80">
          The rider will navigate to this pin.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-white dark:bg-emerald-900 dark:text-emerald-50 dark:hover:bg-emerald-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success('Address confirmed');
              onConfirm();
            }}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
