'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';
import { useLivePoll } from '@/lib/use-live-poll';
import { useVendorOpenSync } from '@/lib/vendor-open-sync';
import VendorAvailabilityPanel from '@/components/vendor/availability/VendorAvailabilityPanel';

import { ORDER_STATUS_LABEL } from '@/lib/order-status';

const STATUS_LABEL = ORDER_STATUS_LABEL;

type Recent = {
  id: string;
  orderNumber: string;
  employeeName: string;
  status: string;
  total: number;
  deliveryDate?: string;
  deliveryTime?: string | null;
  items: { quantity: number; menuItem: { name: string } }[];
};

type Live = {
  accepting: boolean;
  onLunch?: boolean;
  address: string | null;
  menuCount: number;
  availableCount: number;
  newOrders: number;
  delayedDeliveries?: number;
  recentOrders: Recent[];
};

export default function VendorDashboardLive() {
  const [live, setLive] = useState<Live | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useLivePoll(async () => {
    const res = await fetch('/api/vendor/live', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as Live;
    const ids = data.recentOrders.map((o) => o.id);
    if (seen.current) {
      const fresh = ids.filter((id) => !seen.current!.has(id));
      if (fresh.length > 0) {
        toast.success(
          fresh.length === 1 ? 'New order received' : `${fresh.length} new orders`
        );
      }
    }
    seen.current = new Set(ids);
    setLive(data);
  }, 4000);

  const onOpenSync = useCallback((accepting: boolean) => {
    setLive((prev) =>
      prev
        ? { ...prev, accepting, onLunch: accepting ? false : prev.onLunch }
        : {
            accepting,
            onLunch: false,
            address: null,
            menuCount: 0,
            availableCount: 0,
            newOrders: 0,
            delayedDeliveries: 0,
            recentOrders: [],
          }
    );
  }, []);
  useVendorOpenSync(onOpenSync);

  const accepting = live?.accepting ?? false;
  const onLunch = live?.onLunch ?? false;
  const newOrders = live?.newOrders ?? 0;
  const delayedDeliveries = live?.delayedDeliveries ?? 0;
  const availableCount = live?.availableCount ?? 0;
  const menuCount = live?.menuCount ?? 0;
  const address = live?.address;
  const recentOrders = live?.recentOrders ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/vendor/orders"
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            New orders
          </p>
          <p className="mt-2 text-3xl font-bold">{newOrders}</p>
          <p className="mt-1 text-xs text-neutral-500">Waiting for you</p>
        </Link>
        <Link
          href="/vendor/delivery"
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Delivery
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${
              delayedDeliveries > 0 ? 'text-amber-700' : 'text-neutral-900 dark:text-white'
            }`}
          >
            {delayedDeliveries}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {delayedDeliveries > 0
              ? 'Over 1 hour — tap to track'
              : 'Runs on time'}
          </p>
        </Link>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Store
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${
              accepting ? 'text-emerald-600' : 'text-amber-700'
            }`}
          >
            {onLunch ? 'Lunch' : accepting ? 'Open' : 'Closed'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {onLunch
              ? 'Not taking orders until lunch ends'
              : accepting
                ? 'Taking orders'
                : 'Not visible as open'}
          </p>
        </div>
        <Link
          href="/vendor/menu"
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Live dishes
          </p>
          <p className="mt-2 text-3xl font-bold">{availableCount}</p>
          <p className="mt-1 text-xs text-neutral-500">
            of {menuCount} on your menu
          </p>
        </Link>
        <Link
          href="/vendor/store"
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Location
          </p>
          <p className="mt-2 line-clamp-2 text-lg font-semibold">
            {address || 'Add address'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Shown to customers</p>
        </Link>
      </section>

      <VendorAvailabilityPanel />

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Up next</h2>
          <Link
            href="/vendor/orders"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            All orders
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500 dark:bg-neutral-950">
            No orders yet. Keep your menu live and the store open.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {recentOrders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">
                    {order.orderNumber}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {order.deliveryDate
                      ? String(order.deliveryDate).slice(0, 10)
                      : ''}
                    {order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
                    {order.employeeName ? ` · ${order.employeeName}` : ''} ·{' '}
                    {order.items
                      .map((i) => `${i.quantity}× ${i.menuItem.name}`)
                      .join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatMYR(order.total)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
