'use client';

import { useOrderLive } from '@/lib/use-order-live';
import DeliveryClock from '@/components/delivery/DeliveryClock';
import DeliveryProofCard from '@/components/delivery/DeliveryProofCard';
import RouteMap from '@/components/maps/RouteMap';

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
  deliveryLat,
  deliveryLng,
  proofTakenAt,
  proofLat,
  proofLng,
  deliveryLocation,
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
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  proofTakenAt?: string | Date | null;
  proofLat?: number | null;
  proofLng?: number | null;
  deliveryLocation?: string | null;
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
    proofTakenAt: proofTakenAt ? String(proofTakenAt) : null,
    proofLat: proofLat ?? null,
    proofLng: proofLng ?? null,
    deliveryLat: deliveryLat ?? null,
    deliveryLng: deliveryLng ?? null,
  });

  if (live.status === 'CANCELLED') return null;

  return (
    <div className="w-full max-w-lg space-y-3">
      {live.courierName && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          Rider: {live.courierName}
        </p>
      )}
      <RouteMap
        lat={live.deliveryLat}
        lng={live.deliveryLng}
        address={deliveryLocation}
      />
      {live.dueAt && (
        <DeliveryClock dueAt={live.dueAt} deliveredAt={live.deliveredAt} />
      )}
      <DeliveryProofCard
        proof={live.delayProof}
        takenAt={live.proofTakenAt}
        lat={live.proofLat}
        lng={live.proofLng}
        reason={live.delayReason}
      />
      {live.status === 'DELIVERED' ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          Complete — marked as received.
        </p>
      ) : (
        <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
          The rider takes a photo with time and location when they arrive. You
          can see it here. After pickup, delivery has 1 hour.
        </p>
      )}
    </div>
  );
}
