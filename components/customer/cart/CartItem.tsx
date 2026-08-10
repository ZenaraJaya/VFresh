'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatMYR } from '@/lib/pricing';
import type { CartLine } from '@/types';

interface CartItemProps {
  line: CartLine;
  /** Hides the notes field in the narrow slide-over. */
  compact?: boolean;
}

export default function CartItem({ line, compact }: CartItemProps) {
  const { setQuantity, removeItem, setNotes } = useCart();
  const { menuItem, quantity, notes } = line;

  return (
    <div className="flex gap-3 border-b border-neutral-200 py-4 last:border-b-0 dark:border-neutral-800">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
        {menuItem.image && (
          <Image
            src={menuItem.image}
            alt={menuItem.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/menu/${menuItem.id}`}
              className="block truncate font-medium hover:text-emerald-600"
            >
              {menuItem.name}
            </Link>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {menuItem.category}
            </p>
          </div>
          <button
            onClick={() => removeItem(menuItem.id)}
            aria-label={`Remove ${menuItem.name}`}
            className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setQuantity(menuItem.id, quantity - 1)}
              aria-label="Decrease quantity"
              className="rounded-l-lg px-2 py-1 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-8 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(menuItem.id, quantity + 1)}
              aria-label="Increase quantity"
              className="rounded-r-lg px-2 py-1 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMYR(menuItem.price * quantity)}
          </span>
        </div>

        {!compact && (
          <input
            type="text"
            value={notes ?? ''}
            onChange={(e) => setNotes(menuItem.id, e.target.value)}
            placeholder="Notes (e.g. no onions)"
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
        )}
      </div>
    </div>
  );
}
