'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderReceiveButton({
  orderNumber,
  status,
  stockDeducted,
}: {
  orderNumber: string;
  status: string;
  stockDeducted?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const received = status === 'DELIVERED' || stockDeducted;
  const cancelled = status === 'CANCELLED';

  if (cancelled) return null;

  const receive = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/orders/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not receive');
      toast.success('Received — leftover packs updated');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not receive');
    } finally {
      setSaving(false);
    }
  };

  if (received) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
        Received. Today’s leftover packs for these dishes went down.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={receive}
      disabled={saving}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white hover:bg-emerald-600 disabled:opacity-60 sm:w-auto"
    >
      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
      Receive
    </button>
  );
}
