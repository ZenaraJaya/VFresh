'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import CartItem from './CartItem';
import CheckoutLink from '@/components/customer/auth/CheckoutLink';
import { useCart } from '@/context/CartContext';
import { formatMYR } from '@/lib/pricing';

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { lines, subtotal, count, clear } = useCart();

  // Close on Escape and stop the page behind from scrolling while open.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5 text-emerald-500" />
            Your cart
            {count > 0 && (
              <span className="text-sm font-normal text-neutral-500">
                ({count})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-lg p-2 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingBag className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
              <p className="text-neutral-500 dark:text-neutral-400">
                Your cart is empty
              </p>
              <Link
                href="/menu"
                onClick={onClose}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
              >
                Browse the menu
              </Link>
            </div>
          ) : (
            lines.map((line) => (
              <CartItem key={line.menuItem.id} line={line} compact />
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-3 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">
                Subtotal
              </span>
              <span className="text-lg font-bold">{formatMYR(subtotal)}</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tax and delivery are calculated at checkout.
            </p>
            <CheckoutLink
              onClick={onClose}
              className="block rounded-xl bg-emerald-500 px-4 py-3 text-center font-medium text-white transition hover:bg-emerald-600"
            >
              Checkout
            </CheckoutLink>
            <div className="flex items-center justify-between text-sm">
              <Link
                href="/cart"
                onClick={onClose}
                className="text-neutral-600 hover:text-emerald-600 dark:text-neutral-400"
              >
                View full cart
              </Link>
              <button
                onClick={clear}
                className="text-neutral-500 hover:text-red-600"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
