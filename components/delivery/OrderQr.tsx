'use client';

import { useEffect, useState } from 'react';
import { deliveryScanPath } from '@/lib/order-scan';

export default function OrderQr({
  orderNumber,
  size = 180,
}: {
  orderNumber: string;
  size?: number;
}) {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const data = origin ? `${origin}${deliveryScanPath(orderNumber)}` : '';
  const src = data
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
    : '';

  return (
    <div className="inline-flex flex-col items-center gap-2">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`QR for ${orderNumber}`}
          width={size}
          height={size}
          className="rounded-xl border border-neutral-200 bg-white p-2 dark:border-neutral-700"
        />
      ) : (
        <div
          className="rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700"
          style={{ width: size, height: size }}
        />
      )}
      <p className="text-center text-[11px] text-neutral-500">
        Rider scans this after signing in
      </p>
    </div>
  );
}
