'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import {
  isVendorAcceptingOrders,
  vendorClosedLabel,
} from '@/lib/vendor-availability';
import type { MenuItem } from '@/types';

export default function AddToCartPanel({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const accepting = item.vendor
    ? isVendorAcceptingOrders({
        ...item.vendor,
        isOpen: item.vendor.isOpen ?? true,
        status: 'APPROVED',
      })
    : true;
  const closedLabel = item.vendor
    ? vendorClosedLabel({
        ...item.vendor,
        isOpen: item.vendor.isOpen ?? true,
      })
    : null;

  const handleAdd = () => {
    if (!accepting) {
      toast.error('This vendor is temporarily closed');
      return;
    }
    addItem(item, quantity, notes.trim() || undefined);
    toast.success(`${quantity} × ${item.name} added to cart`);
    setQuantity(1);
    setNotes('');
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
      {!accepting && closedLabel && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {closedLabel}
        </p>
      )}

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            disabled={!accepting}
            className="rounded-l-xl px-3 py-2 transition hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(500, q + 1))}
            aria-label="Increase quantity"
            disabled={!accepting}
            className="rounded-r-xl px-3 py-2 transition hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Special requests
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          disabled={!accepting}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. no onions, dressing on the side"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={!accepting}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition ${
            accepting
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'cursor-not-allowed bg-neutral-200 text-neutral-500'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          {accepting ? 'Add to cart' : 'Not available'}
        </button>
        <Link
          href="/cart"
          className="rounded-xl border border-neutral-300 px-5 py-3 font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}
