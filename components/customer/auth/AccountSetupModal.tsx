'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Leaf, X } from 'lucide-react';
import { lockBodyScroll } from '@/lib/body-scroll-lock';
import AccountSetupForm from './AccountSetupForm';

export default function AccountSetupModal({
  open,
  defaultName,
  defaultEmail,
  onComplete,
}: {
  open: boolean;
  defaultName?: string;
  defaultEmail?: string;
  onComplete: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
    };
    document.addEventListener('keydown', onKey, true);
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey, true);
      unlock();
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-setup-title"
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                VFresh
              </p>
              <h2
                id="account-setup-title"
                className="text-lg font-semibold text-neutral-900 dark:text-white"
              >
                Set payment and address
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onComplete}
            aria-label="Skip for now"
            className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-5">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Add where we should deliver and how you will pay. You can change
            this later under Account → Billing.
          </p>
          <AccountSetupForm
            defaultName={defaultName}
            defaultEmail={defaultEmail}
            onSaved={onComplete}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
