'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';
import type { Order, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED'
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  PREPARING:
    'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  READY: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
  DELIVERED:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/admin/orders${query}`);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Request failed');

      // Patch in place so the row doesn't jump while the filter is active.
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
      toast.success(`Marked as ${status.toLowerCase()}`);
    } catch {
      toast.error('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Orders
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Track and advance every order through fulfilment
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', ...STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === status
                ? 'bg-emerald-500 text-white'
                : 'border border-neutral-200 bg-white hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
          <p className="text-neutral-500 dark:text-neutral-400">
            No orders{statusFilter === 'ALL' ? ' yet' : ` with status ${statusFilter}`}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Employee</th>
                <th className="px-4 py-3 font-semibold">Delivery</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {order.items?.length ?? 0} item
                      {(order.items?.length ?? 0) === 1 ? '' : 's'}
                    </p>
                  </td>
                  <td className="px-4 py-3">{order.company?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {order.employeeName}
                    {order.department && (
                      <p className="text-xs text-neutral-500">
                        {order.department}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {order.deliveryDate.slice(0, 10)}
                    {order.deliveryTime && (
                      <p className="text-xs text-neutral-500">
                        {order.deliveryTime}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatMYR(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          STATUS_STYLES[order.status] ?? ''
                        }`}
                      >
                        {order.status}
                      </span>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          updateStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
