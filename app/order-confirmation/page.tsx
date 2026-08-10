'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import SiteShell from '@/components/customer/layout/SiteShell';

/**
 * Order lookup. The confirmation itself lives at
 * /order-confirmation/[orderNumber]; this is the landing spot for people who
 * arrive without a number in the URL.
 */
export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (trimmed) router.push(`/order-confirmation/${encodeURIComponent(trimmed)}`);
  };

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-md px-4 py-24">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          Track an order
        </h1>
        <p className="mt-2 text-center text-neutral-600 dark:text-neutral-400">
          Enter the order number from your confirmation, e.g.{' '}
          <span className="font-mono">ORD-20260810-0001</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-…"
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-4 font-mono outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-white transition hover:bg-emerald-600"
          >
            Find my order
          </button>
        </form>
      </div>
    </SiteShell>
  );
}
