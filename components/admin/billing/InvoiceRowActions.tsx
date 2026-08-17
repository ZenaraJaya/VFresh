'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoiceRowActions({
  id,
  invoiceNumber,
  status,
}: {
  id: string;
  invoiceNumber: string;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancelled = status === 'CANCELLED';
  const paid = status === 'PAID';

  const cancel = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not cancel');
      toast.success('Invoice cancelled');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
        <Link
          href={`/admin/billing/${id}`}
          className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
        >
          {status === 'DRAFT' ? 'Edit' : 'Preview'}
        </Link>
        {!cancelled && !paid ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-white hover:text-red-800 dark:border-red-900 dark:text-red-400"
          >
            Cancel
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">Cancel invoice</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Cancel{' '}
              <span className="font-mono font-medium">{invoiceNumber}</span>?
              Orders go back to unbilled so you can invoice them again.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-white dark:hover:text-neutral-900"
              >
                Keep invoice
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void cancel()}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-white hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:bg-white dark:hover:text-red-700"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Cancel invoice
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
