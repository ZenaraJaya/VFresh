'use client';

import { useOrderLive } from '@/lib/use-order-live';

export default function OrderDeliveryNote({
  orderNumber,
  status: initialStatus,
}: {
  orderNumber: string;
  status: string;
}) {
  const { status } = useOrderLive(orderNumber, {
    status: initialStatus,
    stockDeducted: false,
  });

  if (status === 'CANCELLED') return null;

  if (status === 'DELIVERED') {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
        Complete — the delivery person marked this as delivered to you.
      </p>
    );
  }

  return (
    <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
      The delivery person will mark this <span className="font-semibold">Complete</span>{' '}
      when it arrives. Leave this page open to see it update.
    </p>
  );
}
