'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import type { MenuItem } from '@/types';

export default function AddToCartPanel({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    addItem(item, quantity, notes.trim() || undefined);
    toast.success(`${quantity} × ${item.name} added to cart`);
    setQuantity(1);
    setNotes('');
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="rounded-l-xl px-3 py-2 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(500, q + 1))}
            aria-label="Increase quantity"
            className="rounded-r-xl px-3 py-2 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. no onions, dressing on the side"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-medium text-white transition hover:bg-emerald-600"
        >
          <ShoppingBag className="h-4 w-4" />
          Add to cart
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
