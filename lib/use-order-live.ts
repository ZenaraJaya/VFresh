'use client';

import { useEffect, useState } from 'react';

export type OrderLiveSnap = {
  status: string;
  stockDeducted: boolean;
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
  };
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
