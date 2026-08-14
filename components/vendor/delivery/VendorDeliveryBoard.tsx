'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLivePoll } from '@/lib/use-live-poll';
import { deliveryTrackPayload, isDeliveryLate, riderAwaitingReply } from '@/lib/delivery-sla';
import DeliveryClock from '@/components/delivery/DeliveryClock';
import DelayNotice from '@/components/delivery/DelayNotice';
import OrderQr from '@/components/delivery/OrderQr';
import { ymdFromValue } from '@/lib/miri-date';

type Row = {
  id: string;
  orderNumber: string;
  employeeName: string;
  deliveryLocation: string;
  deliveryDate: string;
  deliveryTime: string | null;
  status: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  delayReason?: string | null;
  delayProof?: string | null;
  courierName?: string | null;
  updatedAt?: string;
  riderNotifiedAt?: string | null;
  riderNotifyNote?: string | null;
  riderAckAt?: string | null;
  company: { name: string };
  items: { quantity: number; menuItem: { name: string } }[];
};

export default function VendorDeliveryBoard() {
  const [orders, setOrders] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/vendor/orders', { cache: 'no-store' });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Could not load deliveries');
    } finally {
      setLoading(false);
    }
  };

  useLivePoll(load, 5000);

  const notifyRider = async (order: Row) => {
    setNotifying(order.id);
    try {
      const res = await fetch(`/api/vendor/orders/${order.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not notify');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                riderNotifiedAt: data.riderNotifiedAt,
                riderNotifyNote: data.riderNotifyNote,
              }
            : o
        )
      );
      if (data.whatsapp) {
        window.open(data.whatsapp, '_blank', 'noopener,noreferrer');
        toast.success('Ping sent — WhatsApp opened');
      } else if (data.sms) {
        window.location.href = data.sms;
        toast.success('Ping sent — SMS opened');
      } else {
        toast.success(
          'Ping sent to the delivery desk. Add a rider phone on Store to also WhatsApp them.'
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not notify');
    } finally {
      setNotifying(null);
    }
  };

  const active = useMemo(() => {
    const open = orders.filter(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );
    open.sort((a, b) => Number(isDeliveryLate(b)) - Number(isDeliveryLate(a)));
    const done = orders.filter((o) => o.status === 'DELIVERED' && (o.delayReason || isDeliveryLate(o)));
    return { open, done };
  }, [orders]);

  const lateCount = active.open.filter((o) => isDeliveryLate(o)).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Delivery
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Track runs
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          After pickup, the rider has 1 hour. If they do not reply, tap
          Notify — it appears on{' '}
          <Link href="/delivery" className="font-medium text-emerald-700 hover:underline">
            /delivery
          </Link>
          {' '}and WhatsApp if you saved a rider phone on Store.
        </p>
      </div>

      {lateCount > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {lateCount} {lateCount === 1 ? 'order is' : 'orders are'} over 1 hour —
          check with the rider.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Out now
            </h2>
            {active.open.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
                No open deliveries.
              </p>
            ) : (
              <ul className="space-y-3">
                {active.open.map((order) => {
                  const track = deliveryTrackPayload(order);
                  return (
                    <li
                      key={order.id}
                      className={`rounded-2xl border bg-white p-4 dark:bg-neutral-900 ${
                        track.late
                          ? 'border-amber-300 dark:border-amber-800'
                          : 'border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <p className="font-mono text-sm font-semibold">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-sm">
                        {order.employeeName} · {order.company.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {ymdFromValue(order.deliveryDate)}
                        {order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
                        {' · '}
                        {order.deliveryLocation}
                      </p>
                      {order.courierName && (
                        <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                          Rider: {order.courierName}
                        </p>
                      )}
                      <div className="mt-3">
                        <DeliveryClock dueAt={track.dueAt} />
                      </div>
                      {riderAwaitingReply(order) ? (
                        <p className="mt-2 text-xs font-semibold text-amber-800">
                          Waiting for rider to tap “I saw this”
                        </p>
                      ) : order.riderAckAt ? (
                        <p className="mt-2 text-xs text-emerald-700">
                          Rider replied
                        </p>
                      ) : null}
                      <button
                        type="button"
                        disabled={notifying === order.id}
                        onClick={() => void notifyRider(order)}
                        className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                      >
                        {notifying === order.id ? 'Notifying…' : 'Notify rider'}
                      </button>
                      <div className="mt-3">
                        <OrderQr orderNumber={order.orderNumber} size={140} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {active.done.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Late arrivals
              </h2>
              <ul className="space-y-3">
                {active.done.map((order) => {
                  const track = deliveryTrackPayload(order);
                  return (
                    <li
                      key={order.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <p className="font-mono text-sm font-semibold">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-sm">
                        {order.employeeName} · {order.company.name}
                      </p>
                      <div className="mt-3">
                        <DeliveryClock
                          dueAt={track.dueAt}
                          deliveredAt={track.deliveredAt}
                        />
                      </div>
                      <div className="mt-3">
                        <DelayNotice
                          reason={order.delayReason}
                          proof={order.delayProof}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
