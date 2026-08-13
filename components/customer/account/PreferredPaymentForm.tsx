'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PaymentForm from '@/components/customer/checkout/PaymentForm';
import type { PaymentMethod } from '@/types';

export default function PreferredPaymentForm({
  initial,
}: {
  initial: PaymentMethod;
}) {
  const router = useRouter();
  const [value, setValue] = useState<PaymentMethod>(initial);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save');
      toast.success('Payment method saved');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-4">
      <PaymentForm value={value} onChange={setValue} />
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save payment method'}
      </button>
    </form>
  );
}
