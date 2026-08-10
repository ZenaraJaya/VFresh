'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { formatMYR } from '@/lib/pricing';

export default function OrderSummary() {
  const { lines, subtotal, tax, deliveryFee, total } = useCart();

  return (
    <aside className="h-fit rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold">Order summary</h2>

      <ul className="mb-4 space-y-3">
        {lines.map(({ menuItem, quantity, notes }) => (
          <li key={menuItem.id} className="flex gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {menuItem.image && (
                <Image
                  src={menuItem.image}
                  alt={menuItem.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              )}
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white dark:bg-white dark:text-neutral-900">
                {quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{menuItem.name}</p>
              {notes && (
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {notes}
                </p>
              )}
            </div>
            <span className="text-sm font-medium">
              {formatMYR(menuItem.price * quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
        <div className="flex justify-between">
          <dt className="text-neutral-600 dark:text-neutral-400">Subtotal</dt>
          <dd className="font-medium">{formatMYR(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600 dark:text-neutral-400">SST (6%)</dt>
          <dd className="font-medium">{formatMYR(tax)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600 dark:text-neutral-400">Delivery</dt>
          <dd className="font-medium">
            {deliveryFee === 0 ? 'Free' : formatMYR(deliveryFee)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold">{formatMYR(total)}</span>
      </div>

      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        Totals are recalculated from live menu prices when the order is placed.
      </p>
    </aside>
  );
}
