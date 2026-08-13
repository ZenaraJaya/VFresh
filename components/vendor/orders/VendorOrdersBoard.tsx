'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLivePoll } from '@/lib/use-live-poll';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';
import { deliveryDayLabel } from '@/lib/order-priority';
import { miriYmd, ymdFromValue } from '@/lib/miri-date';
import type { OrderStatus } from '@/types';

type Row = {
  id: string;
  orderNumber: string;
  employeeName: string;
  deliveryLocation: string;
  deliveryDate: string;
  deliveryTime: string | null;
  status: OrderStatus;
  total: number;
  createdAt: string;
  company: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
};

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

function groupOrders(orders: Row[]) {
  const today = miriYmd();
  const map = new Map<string, Row[]>();
  for (const order of orders) {
    const label = deliveryDayLabel(order.deliveryDate, today);
    const list = map.get(label) ?? [];
    list.push(order);
    map.set(label, list);
  }
  return [...map.entries()];
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'New',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'On the way',
  DELIVERED: 'Complete',
  CANCELLED: 'Cancelled',
};

export default function VendorOrdersBoard() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const seen = useRef<Set<string> | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/vendor/orders', { cache: 'no-store' });
      const data = await res.json();
      const next: Row[] = Array.isArray(data) ? data : [];
      const ids = next.map((o) => o.id);
      if (seen.current) {
        const fresh = ids.filter((id) => !seen.current!.has(id));
        if (fresh.length > 0) {
          toast.success(
            fresh.length === 1 ? 'New order received' : `${fresh.length} new orders`
          );
        }
      }
      seen.current = new Set(ids);
      setOrders(next);
    } catch {
      if (!silent) toast.error('Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  useLivePoll(() => load(true), 4000);

  const setStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('fail');
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
      toast.success(`Marked ${STATUS_LABEL[status]}`);
    } catch {
      toast.error('Could not update status');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Kitchen
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Orders
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Earliest delivery first, then time. When you hand it to the customer,
          tap Complete.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          No orders yet. When customers buy your dishes, they show up here.
        </p>
      ) : (
        <div className="space-y-8">
          {groupOrders(orders).map(([label, group]) => (
            <section key={label}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {label}
              </h2>
              <ul className="space-y-3">
                {group.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-sm">
                    {order.employeeName}
                    <span className="text-neutral-500">
                      {' '}
                      · {order.company.name}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {ymdFromValue(order.deliveryDate)}
                    {order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
                    {' · '}
                    {order.deliveryLocation}
                  </p>
                </div>
                <p className="text-lg font-bold">{formatMYR(order.total)}</p>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {order.items.map((item, i) => (
                  <li key={`${order.id}-${i}`}>
                    {item.quantity} × {item.menuItem.name}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    disabled={updating === order.id}
                    onClick={() => setStatus(order.id, 'DELIVERED')}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Complete
                  </button>
                )}
                <label className="text-xs font-medium text-neutral-500">
                  Status
                </label>
                <select
                  value={order.status}
                  disabled={updating === order.id}
                  onChange={(e) =>
                    setStatus(order.id, e.target.value as OrderStatus)
                  }
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
