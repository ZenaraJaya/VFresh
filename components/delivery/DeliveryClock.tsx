'use client';

import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/delivery-sla';

export default function DeliveryClock({
  dueAt,
  deliveredAt,
}: {
  dueAt: string;
  deliveredAt?: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deliveredAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deliveredAt]);

  const due = new Date(dueAt).getTime();
  const end = deliveredAt ? new Date(deliveredAt).getTime() : now;
  const left = due - end;
  const late = left < 0;

  return (
    <p
      className={`rounded-xl px-3 py-2 text-sm font-semibold ${
        late
          ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
      }`}
    >
      {deliveredAt
        ? late
          ? `Arrived ${formatDuration(left)} late`
          : `Arrived on time (${formatDuration(left)} under 1 hour)`
        : late
          ? `Over 1 hour — ${formatDuration(left)} late`
          : `${formatDuration(left)} left to arrive (max 1 hour)`}
    </p>
  );
}
