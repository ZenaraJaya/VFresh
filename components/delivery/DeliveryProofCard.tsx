'use client';

import { formatCoords } from '@/lib/maps';

export default function DeliveryProofCard({
  proof,
  takenAt,
  lat,
  lng,
  reason,
}: {
  proof?: string | null;
  takenAt?: string | Date | null;
  lat?: number | null;
  lng?: number | null;
  reason?: string | null;
}) {
  if (!proof && !reason && !takenAt) return null;
  const when = takenAt ? new Date(takenAt) : null;

  return (
    <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
        Delivery proof
      </p>
      {when && Number.isFinite(when.getTime()) ? (
        <p className="text-sm text-neutral-800 dark:text-neutral-100">
          Taken {when.toLocaleString('en-MY', { timeZone: 'Asia/Kuching' })}
        </p>
      ) : null}
      {formatCoords(lat, lng) ? (
        <p className="text-xs text-neutral-500">Location {formatCoords(lat, lng)}</p>
      ) : null}
      {reason ? (
        <p className="text-sm text-neutral-800 dark:text-neutral-100">{reason}</p>
      ) : null}
      {proof ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={proof}
          alt="Delivery proof"
          className="max-h-64 w-full rounded-lg object-cover"
        />
      ) : null}
    </div>
  );
}
