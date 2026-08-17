'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';

type Draft = {
  companyId: string;
  name: string;
  billingEmail: string;
  orderCount: number;
  totalAmount: number;
  orders: {
    id: string;
    orderNumber: string;
    employeeName: string;
    total: number;
    createdAt: string;
  }[];
};

type Preview = {
  periodLabel: string;
  dueDate: string;
  drafts: Draft[];
};

export default function IssueInvoicesButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const loadPreview = async () => {
    setBusy(true);
    setOpen(true);
    try {
      const res = await fetch('/api/admin/invoices?period=current');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load preview');
      setPreview(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load preview');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const createDrafts = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'current' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create drafts');
      if (!data.created) {
        toast.success('Nothing to invoice for this month');
        setOpen(false);
        setPreview(null);
        router.refresh();
        return;
      }
      toast.success(
        `Created ${data.created} draft${data.created === 1 ? '' : 's'} — edit, then send`
      );
      if (Array.isArray(data.errors) && data.errors.length) {
        toast.error('Some drafts could not be created. Try again.');
      }
      const first = Array.isArray(data.invoices) ? data.invoices[0] : null;
      setOpen(false);
      setPreview(null);
      if (first?.id) {
        router.push(`/admin/billing/${first.id}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not create drafts'
      );
    } finally {
      setSending(false);
    }
  };

  const grandTotal = preview?.drafts.reduce(
    (sum, draft) => sum + draft.totalAmount,
    0
  );

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => void loadPreview()}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Preview invoices
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white dark:bg-neutral-900">
            <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <h2 className="text-lg font-semibold">Invoice preview</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {preview
                  ? `${preview.periodLabel} · due ${preview.dueDate.slice(0, 10)}. Drafts stay editable until you send them.`
                  : 'Loading unbilled company orders…'}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {busy && !preview ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : !preview?.drafts.length ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  Nothing outstanding this month.
                </p>
              ) : (
                <div className="space-y-4">
                  {preview.drafts.map((draft) => (
                    <article
                      key={draft.companyId}
                      className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{draft.name}</h3>
                          <p className="text-xs text-neutral-500">
                            {draft.billingEmail || 'No billing email'}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatMYR(draft.totalAmount)}
                        </p>
                      </div>
                      <ul className="mt-3 divide-y divide-neutral-100 text-sm dark:divide-neutral-800">
                        {draft.orders.map((order) => (
                          <li
                            key={order.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 py-1.5"
                          >
                            <span className="font-mono text-xs">
                              {order.orderNumber}
                            </span>
                            <span className="text-neutral-500">
                              {order.employeeName} · {formatMYR(order.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                  <p className="text-right text-sm font-semibold">
                    Total {formatMYR(grandTotal ?? 0)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  setOpen(false);
                  setPreview(null);
                }}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-white dark:hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending || !preview?.drafts.length}
                onClick={() => void createDrafts()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create drafts
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
