'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLivePoll } from '@/lib/use-live-poll';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';
import { deliveryDayLabel } from '@/lib/order-priority';
import { miriYmd, ymdFromValue } from '@/lib/miri-date';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_LABEL, VENDOR_ORDER_STATUSES } from '@/lib/order-status';
import { DELAY_REASON_MIN, isDeliveryLate } from '@/lib/delivery-sla';
import { readImageFileAsJpeg } from '@/lib/read-image-file';
import DeliveryProofCard from '@/components/delivery/DeliveryProofCard';

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
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  delayReason?: string | null;
  delayProof?: string | null;
  proofTakenAt?: string | Date | null;
  proofLat?: number | null;
  proofLng?: number | null;
  courierName?: string | null;
  updatedAt?: string;
  company: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
};

const STATUSES: OrderStatus[] = [...VENDOR_ORDER_STATUSES];

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

const STATUS_LABEL = ORDER_STATUS_LABEL;

export default function VendorOrdersBoard() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [delayFor, setDelayFor] = useState<string | null>(null);
  const [delayReason, setDelayReason] = useState('');
  const [delayProof, setDelayProof] = useState('');
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

  const setStatus = async (
    id: string,
    status: OrderStatus,
    extras?: { delayReason?: string; delayProof?: string }
  ) => {
    const row = orders.find((o) => o.id === id);
    if (status === 'DELIVERED' && row && isDeliveryLate(row) && !extras?.delayReason) {
      setDelayFor(id);
      return;
    }
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extras }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'fail');
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, ...data } : o))
      );
      setDelayFor(null);
      setDelayReason('');
      setDelayProof('');
      toast.success(`Marked ${STATUS_LABEL[status]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update status');
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
          Earliest delivery first. Mark Ready to pickup when the bag is waiting.
          The rider taps On the way to the restaurant so no one else takes it.
          Complete when the customer receives it.
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
                  {order.courierName && (
                    <p className="mt-1 text-sm font-medium text-emerald-800">
                      Rider: {order.courierName}
                    </p>
                  )}
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
                {isDeliveryLate(order) &&
                  order.status !== 'DELIVERED' &&
                  order.status !== 'CANCELLED' && (
                    <p className="mt-2 text-xs font-semibold text-amber-800">
                      Over 1 hour — rider must add a reason and photo
                    </p>
                  )}
                {order.delayReason && (
                  <p className="mt-2 text-xs text-amber-800">
                    Delay: {order.delayReason}
                  </p>
                )}
                <div className="mt-3">
                  <DeliveryProofCard
                    proof={order.delayProof}
                    takenAt={order.proofTakenAt}
                    lat={order.proofLat}
                    lng={order.proofLng}
                    reason={order.delayReason}
                  />
                </div>
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
                {delayFor === order.id && (
                  <div className="mt-3 w-full space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Over 1 hour — reason and photo required
                    </p>
                    <textarea
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                      placeholder="Why was it late?"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setDelayProof(await readImageFileAsJpeg(file, 960, 0.78));
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : 'Could not read photo'
                          );
                        }
                      }}
                      className="w-full text-xs"
                    />
                    <button
                      type="button"
                      disabled={
                        updating === order.id ||
                        delayReason.trim().length < DELAY_REASON_MIN ||
                        !delayProof
                      }
                      onClick={() =>
                        void setStatus(order.id, 'DELIVERED', {
                          delayReason: delayReason.trim(),
                          delayProof,
                        })
                      }
                      className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Complete with proof
                    </button>
                  </div>
                )}
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
