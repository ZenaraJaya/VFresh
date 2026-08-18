'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Leaf, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import { DELAY_REASON_MIN } from '@/lib/delivery-sla';
import { ORDER_STATUS_LABEL } from '@/lib/order-status';
import { useLivePoll } from '@/lib/use-live-poll';
import DeliveryClock from '@/components/delivery/DeliveryClock';
import DeliveryProofCard from '@/components/delivery/DeliveryProofCard';
import ProofCapture from '@/components/delivery/ProofCapture';
import QrScanner from '@/components/delivery/QrScanner';
import RouteMap from '@/components/maps/RouteMap';

type Track = {
  promisedAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  dueAt: string;
  late: boolean;
  remainingMs: number;
  delayReason: string | null;
  delayProof: string | null;
};

type Order = {
  orderNumber: string;
  status: string;
  employeeName: string;
  deliveryLocation: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  proofTakenAt?: string | Date | null;
  proofLat?: number | null;
  proofLng?: number | null;
  deliveryDate: string;
  deliveryTime: string | null;
  vendor: { businessName: string } | null;
  company: { name: string } | null;
  courierName?: string | null;
  courierId?: string | null;
  items: { quantity: number; menuItem: { name: string } }[];
  track: Track;
  kitchenPing?: { note: string; at: string | null } | null;
};

const STATUS_LABEL = ORDER_STATUS_LABEL;

export default function DeliveryDesk({
  courierName,
  courierId,
  initialOrder = '',
}: {
  courierName: string;
  courierId: string;
  initialOrder?: string;
}) {
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [runs, setRuns] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState('');
  const [proofMeta, setProofMeta] = useState<{
    takenAt: string;
    lat?: number;
    lng?: number;
  } | null>(null);

  const select = (next: Order) => {
    setOrder(next);
    setOrderNumber(next.orderNumber);
  };

  const loadOne = async (num: string, silent = false) => {
    if (!silent) setLooking(true);
    try {
      const res = await fetch(
        `/api/delivery?orderNumber=${encodeURIComponent(num)}`,
        { cache: 'no-store', credentials: 'same-origin' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!silent) {
          toast.error(data.error || 'Order not found');
        }
        return null;
      }
      const next = data as Order;
      select(next);
      return next;
    } catch {
      if (!silent) toast.error('Could not load that order');
      return null;
    } finally {
      if (!silent) setLooking(false);
    }
  };

  useLivePoll(async () => {
    const res = await fetch('/api/delivery', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const list = Array.isArray(data.orders) ? (data.orders as Order[]) : [];
    setRuns(list);

    setOrder((current) => {
      if (!current) return current;
      return list.find((row) => row.orderNumber === current.orderNumber) ?? current;
    });
  }, 4000);

  useEffect(() => {
    if (initialOrder) void loadOne(initialOrder, false);
    // Open scanned order from the QR link once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (
    action: 'head_to_vendor' | 'pickup' | 'complete' | 'ack' | 'retake_proof'
  ) => {
    if (!order) return;
    if (action === 'complete' || action === 'retake_proof') {
      if (!proof) {
        toast.error('Take a photo as delivery proof');
        return;
      }
      if (order.track.late && reason.trim().length < DELAY_REASON_MIN) {
        toast.error('This run is over 1 hour — add a reason');
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          action,
          ...((action === 'complete' || action === 'retake_proof') && proof
            ? {
                delayReason: reason.trim() || undefined,
                delayProof: proof,
                proofTakenAt: proofMeta?.takenAt,
                proofLat: proofMeta?.lat,
                proofLng: proofMeta?.lng,
              }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Update failed');
        return;
      }
      const next = data as Order;
      select(next);
      toast.success(
        action === 'ack'
          ? 'Kitchen can see you replied'
          : action === 'head_to_vendor'
            ? 'This run is yours — other riders cannot take it'
            : action === 'pickup'
              ? 'Picked up — 1 hour starts now'
              : action === 'retake_proof'
                ? 'Photo updated'
                : 'Marked complete'
      );
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const open = order && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
  const mine = !order?.courierId || order.courierId === courierId;
  const takenByOther = Boolean(order?.courierId && order.courierId !== courierId);
  const canHead =
    open &&
    mine &&
    !order.track.pickedUpAt &&
    (order.status === 'READY' ||
      order.status === 'PREPARING' ||
      order.status === 'CONFIRMED');
  const canPickup = open && mine && order.status === 'HEADING_TO_VENDOR';
  const canComplete =
    open &&
    mine &&
    (order.status === 'OUT_FOR_DELIVERY' || Boolean(order.track.pickedUpAt));
  const canRetake = Boolean(
    order && mine && order.status === 'DELIVERED' && !takenByOther
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Runs</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          When a kitchen marks Ready to pickup, tap On the way to the
          restaurant so the run is yours. Other riders will not see it.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <div className="h-fit space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
          <p className="text-sm font-semibold">Scan QR</p>
          <QrScanner
            onCode={(num) => {
              setOrderNumber(num);
              void loadOne(num);
            }}
          />
          <form
            className="space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800"
            onSubmit={(e) => {
              e.preventDefault();
              const n = orderNumber.trim();
              if (n) void loadOne(n);
            }}
          >
            <label className="block text-xs font-medium text-neutral-500" htmlFor="delivery-order">
              Or look up a number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="delivery-order"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-…"
                className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-4 font-mono text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </div>
            <button
              type="submit"
              disabled={looking}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {looking && <Loader2 className="h-4 w-4 animate-spin" />}
              Find
            </button>
          </form>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            {runs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/50 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/40">
                No open runs yet. When a kitchen confirms or readies an order,
                it shows up here.
              </div>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {runs.map((row) => {
                  const active = order?.orderNumber === row.orderNumber;
                  return (
                    <li key={row.orderNumber}>
                      <button
                        type="button"
                        onClick={() => select(row)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40'
                            : 'border-neutral-200 bg-white hover:border-emerald-300 dark:border-neutral-800 dark:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-xs font-semibold">
                            {row.orderNumber}
                          </p>
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase dark:bg-neutral-800">
                            {STATUS_LABEL[row.status] ?? row.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium">
                          {row.employeeName}
                          {row.company ? ` · ${row.company.name}` : ''}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                          {row.vendor?.businessName ?? 'Kitchen'} ·{' '}
                          {row.deliveryLocation}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {order ? (
            <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                  <p className="mt-1 text-sm">
                    {order.employeeName}
                    {order.company ? ` · ${order.company.name}` : ''}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {order.vendor?.businessName ?? 'Kitchen'}
                  </p>
                  {(order.courierName || courierName) && (
                    <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Rider: {order.courierName || courierName}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold uppercase dark:bg-neutral-800">
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <p className="text-sm text-neutral-700 dark:text-neutral-200">
                {order.deliveryLocation}
              </p>
              <RouteMap
                lat={order.deliveryLat}
                lng={order.deliveryLng}
                follow={Boolean(open && mine)}
              />
              <ul className="text-sm text-neutral-600 dark:text-neutral-300">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.quantity} × {item.menuItem.name}
                  </li>
                ))}
              </ul>

              <DeliveryClock
                dueAt={order.track.dueAt}
                deliveredAt={order.track.deliveredAt}
              />

              {order.kitchenPing && (
                <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    Kitchen needs a reply
                  </p>
                  <p className="text-sm text-neutral-800 dark:text-neutral-100">
                    {order.kitchenPing.note}
                  </p>
                  {open && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void act('ack')}
                      className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      I saw this
                    </button>
                  )}
                </div>
              )}

              {order.track.pickedUpAt && (
                <p className="text-xs text-neutral-500">
                  Picked up{' '}
                  {new Date(order.track.pickedUpAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              )}

              <DeliveryProofCard
                proof={order.track.delayProof}
                takenAt={order.proofTakenAt}
                lat={order.proofLat}
                lng={order.proofLng}
                reason={order.track.delayReason}
              />

              {(canComplete || canRetake) && (
                <div className="space-y-2">
                  {order.track.late ? (
                    <>
                      <label className="text-sm font-medium">
                        Why is it late?
                        <RequiredMark />
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
                        placeholder="Traffic, customer not at desk, rain…"
                      />
                    </>
                  ) : null}
                  <ProofCapture
                    value={proof}
                    onChange={setProof}
                    onMeta={setProofMeta}
                  />
                </div>
              )}

              {takenByOther && (
                <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  This run is with {order.courierName || 'another rider'}
                </p>
              )}

              {(open && mine) || canRetake ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {canHead && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void act('head_to_vendor')}
                      className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 sm:col-span-2"
                    >
                      {saving ? 'Saving…' : 'On the way to the restaurant'}
                    </button>
                  )}
                  {canPickup && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void act('pickup')}
                      className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                    >
                      {saving ? 'Saving…' : 'Picked up'}
                    </button>
                  )}
                  {canComplete && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void act('complete')}
                      className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Complete / received'}
                    </button>
                  )}
                  {canRetake ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void act('retake_proof')}
                      className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700"
                    >
                      {saving ? 'Saving…' : 'Save retake'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-neutral-500 lg:mt-6">
        <Leaf className="h-3.5 w-3.5" />
        <Link href="/" className="hover:text-emerald-700">
          Back to VFresh
        </Link>
      </p>
    </div>
  );
}
