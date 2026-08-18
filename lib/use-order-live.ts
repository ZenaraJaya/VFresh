'use client';

import { useEffect, useState } from 'react';

import { deliveryTrackPayload } from '@/lib/delivery-sla';

export type OrderLiveSnap = {
  status: string;
  stockDeducted: boolean;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  delayReason?: string | null;
  delayProof?: string | null;
  courierName?: string | null;
  proofTakenAt?: string | null;
  proofLat?: number | null;
  proofLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryDate?: string;
  deliveryTime?: string | null;
  dueAt?: string | null;
  late?: boolean;
};

type Entry = {
  listeners: Set<(snap: OrderLiveSnap) => void>;
  timer: ReturnType<typeof setInterval> | null;
  data: OrderLiveSnap;
};

const bus = new Map<string, Entry>();

async function pull(orderNumber: string) {
  const entry = bus.get(orderNumber);
  if (!entry) return;
  const res = await fetch(
    `/api/orders?orderNumber=${encodeURIComponent(orderNumber)}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return;
  const data = await res.json();
  const snap: OrderLiveSnap = {
    status: typeof data.status === 'string' ? data.status : entry.data.status,
    stockDeducted: Boolean(data.stockDeducted),
    pickedUpAt: data.pickedUpAt ?? data.track?.pickedUpAt ?? null,
    deliveredAt: data.deliveredAt ?? data.track?.deliveredAt ?? null,
    delayReason: data.delayReason ?? data.track?.delayReason ?? null,
    delayProof: data.delayProof ?? data.track?.delayProof ?? null,
    courierName: data.courierName ?? null,
    proofTakenAt: data.proofTakenAt ?? null,
    proofLat: data.proofLat ?? null,
    proofLng: data.proofLng ?? null,
    deliveryLat: data.deliveryLat ?? null,
    deliveryLng: data.deliveryLng ?? null,
    deliveryDate: data.deliveryDate,
    deliveryTime: data.deliveryTime ?? null,
    dueAt: data.track?.dueAt ?? null,
    late: Boolean(data.track?.late),
  };
  if (!snap.dueAt && snap.deliveryDate) {
    const track = deliveryTrackPayload({
      status: snap.status,
      deliveryDate: snap.deliveryDate,
      deliveryTime: snap.deliveryTime,
      pickedUpAt: snap.pickedUpAt,
      deliveredAt: snap.deliveredAt,
    });
    snap.dueAt = track.dueAt;
    snap.late = track.late;
  }
  entry.data = snap;
  for (const listener of entry.listeners) listener(snap);
}

/** One poll shared by progress, badge, and receive — updates while the tab stays open. */
export function useOrderLive(
  orderNumber: string,
  initial: OrderLiveSnap,
  ms = 2000
) {
  const [snap, setSnap] = useState(initial);

  useEffect(() => {
    let entry = bus.get(orderNumber);
    if (!entry) {
      entry = {
        listeners: new Set(),
        timer: null,
        data: initial,
      };
      bus.set(orderNumber, entry);
      const run = () => {
        if (document.visibilityState === 'hidden') return;
        void pull(orderNumber);
      };
      void run();
      entry.timer = setInterval(run, ms);
    }

    const listener = (next: OrderLiveSnap) => setSnap(next);
    entry.listeners.add(listener);
    setSnap(entry.data);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull(orderNumber);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      entry.listeners.delete(listener);
      if (entry.listeners.size === 0) {
        if (entry.timer) clearInterval(entry.timer);
        bus.delete(orderNumber);
      }
    };
  }, [orderNumber, ms]);

  return snap;
}
