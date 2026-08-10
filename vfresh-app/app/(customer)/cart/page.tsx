'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import CartItem from '@/components/customer/cart/CartItem';
import { useCart } from '@/context/CartContext';
import { formatMYR, FREE_DELIVERY_THRESHOLD } from '@/lib/pricing';

export default function CartPage() {
  const { lines, subtotal, tax, deliveryFee, total, clear, hydrated } =
    useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-700" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Add a few items from the menu and they&apos;ll show up here.
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600"
        >
          Browse the menu
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const awayFromFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 px-5 dark:border-neutral-800">
            {lines.map((line) => (
              <CartItem key={line.menuItem.id} line={line} />
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            <Link
              href="/menu"
              className="text-sm font-medium text-neutral-600 hover:text-emerald-600 dark:text-neutral-400"
            >
              ← Continue shopping
            </Link>
            <button
              onClick={clear}
              className="text-sm font-medium text-neutral-500 hover:text-red-600"
            >
              Clear cart
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
          <h2 className="mb-4 text-lg font-semibold">Order summary</h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600 dark:text-neutral-400">
                Subtotal
              </dt>
              <dd className="font-medium">{formatMYR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600 dark:text-neutral-400">
                SST (6%)
              </dt>
              <dd className="font-medium">{formatMYR(tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600 dark:text-neutral-400">
                Delivery
              </dt>
              <dd className="font-medium">
                {deliveryFee === 0 ? 'Free' : formatMYR(deliveryFee)}
              </dd>
            </div>
          </dl>

          {awayFromFreeDelivery > 0 && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              Spend {formatMYR(awayFromFreeDelivery)} more for free delivery.
            </p>
          )}

          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">{formatMYR(total)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 block rounded-xl bg-emerald-500 px-4 py-3 text-center font-medium text-white transition hover:bg-emerald-600"
          >
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
