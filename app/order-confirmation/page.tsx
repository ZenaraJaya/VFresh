'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import SiteShell from '@/components/customer/layout/SiteShell';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import StandingOrdersPanel from '@/components/customer/orders/StandingOrdersPanel';
import OrderProgress from '@/components/customer/orders/OrderProgress';

/**
 * Order lookup. Stay on this page to watch status live.
 */
export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [tracked, setTracked] = useState<{
    orderNumber: string;
    status: string;
    stockDeducted: boolean;
  } | null>(null);
  const [looking, setLooking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;
    setLooking(true);
    try {
      const res = await fetch(
        `/api/orders?orderNumber=${encodeURIComponent(trimmed)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        setTracked(null);
        toast.error('Order not found');
        return;
      }
      const data = await res.json();
      setTracked({
        orderNumber: data.orderNumber ?? trimmed,
        status: data.status,
        stockDeducted: Boolean(data.stockDeducted),
      });
    } catch {
      toast.error('Could not look up that order');
    } finally {
      setLooking(false);
    }
  };

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-lg px-4 py-24">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          Track an order
        </h1>
        <p className="mt-2 text-center text-neutral-600 dark:text-neutral-400">
          Enter the order number from your confirmation, e.g.{' '}
          <span className="font-mono">ORD-20260810-0001</span>. Leave this page
          open to watch it update live.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <label className="block text-sm font-medium" htmlFor="orderNumber">
            Order number
            <RequiredMark />
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              id="orderNumber"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-…"
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-4 font-mono outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
          <button
            type="submit"
            disabled={looking}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {looking ? 'Looking…' : 'Find my order'}
          </button>
        </form>

        {tracked && (
          <div className="mt-10 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
            <p className="mb-4 text-center font-mono text-sm font-semibold">
              {tracked.orderNumber}
            </p>
            <OrderProgress
              orderNumber={tracked.orderNumber}
              initialStatus={tracked.status}
              initialStockDeducted={tracked.stockDeducted}
            />
            <p className="mt-5 text-center">
              <Link
                href={`/order-confirmation/${encodeURIComponent(tracked.orderNumber)}`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Full order details
              </Link>
            </p>
          </div>
        )}

        <StandingOrdersPanel />
      </div>
    </SiteShell>
  );
}
