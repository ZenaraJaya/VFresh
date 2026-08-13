'use client';

import SafeImage from '@/components/shared/ui/SafeImage';
import { useCart } from '@/context/CartContext';
import { groupCartByVendor } from '@/lib/group-cart';
import { formatMYR } from '@/lib/pricing';

export default function OrderSummary() {
  const { lines } = useCart();
  const groups = groupCartByVendor(lines);
  const grandTotal = groups.reduce((sum, g) => sum + g.total, 0);

  return (
    <aside className="h-fit rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold">Order summary</h2>

      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.vendorId}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {group.vendorName}
            </p>
            <ul className="space-y-3">
              {group.lines.map(({ menuItem, quantity, notes }) => (
                <li key={menuItem.id} className="flex gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    {menuItem.image && (
                      <SafeImage
                        src={menuItem.image}
                        alt={menuItem.name}
                        className="h-full w-full object-cover"
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
            <p className="mt-2 text-right text-xs text-neutral-500">
              This kitchen: {formatMYR(group.total)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <span className="font-semibold">
          {groups.length > 1 ? 'Combined total' : 'Total'}
        </span>
        <span className="text-xl font-bold">{formatMYR(grandTotal)}</span>
      </div>

      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        {groups.length > 1
          ? 'Checkout creates one order ID per kitchen. Delivery is calculated per kitchen.'
          : 'Totals are recalculated from live menu prices when the order is placed.'}
      </p>
    </aside>
  );
}
