'use client';

import { useOrderLive } from '@/lib/use-order-live';
import DeliveryClock from '@/components/delivery/DeliveryClock';
import DelayNotice from '@/components/delivery/DelayNotice';

export default function OrderDeliveryNote({
  orderNumber,
  status: initialStatus,
  deliveryDate,
  deliveryTime,
  pickedUpAt,
  deliveredAt,
  delayReason,
  delayProof,
  courierName,
}: {
  orderNumber: string;
  status: string;
  deliveryDate: string;
  deliveryTime?: string | null;
  pickedUpAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  delayReason?: string | null;
  delayProof?: string | null;
  courierName?: string | null;
}) {
  const live = useOrderLive(orderNumber, {
    status: initialStatus,
    stockDeducted: false,
    deliveryDate,
    deliveryTime,
    pickedUpAt: pickedUpAt ? String(pickedUpAt) : null,
    deliveredAt: deliveredAt ? String(deliveredAt) : null,
    delayReason,
    delayProof,
    courierName,
  });

  if (live.status === 'CANCELLED') return null;

  return (
    <div className="w-full max-w-lg space-y-3">
      {live.courierName && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          Rider: {live.courierName}
        </p>
      )}
      {live.dueAt && (
        <DeliveryClock dueAt={live.dueAt} deliveredAt={live.deliveredAt} />
      )}
      <DelayNotice reason={live.delayReason} proof={live.delayProof} />
      {live.status === 'DELIVERED' ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          Complete — marked as received.
        </p>
      ) : (
        <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
          After pickup, delivery has 1 hour. If it runs late, the rider must
          add a reason and photo — you will see it here.
        </p>
      )}
    </div>
  );
}
