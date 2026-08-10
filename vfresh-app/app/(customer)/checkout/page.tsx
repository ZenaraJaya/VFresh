'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import CheckoutForm from '@/components/customer/checkout/CheckoutForm';
import OrderSummary from '@/components/customer/checkout/OrderSummary';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
  const { lines, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="h-96 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-24 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-700" />
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Add something to your cart first.
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-600"
        >
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <CheckoutForm />
        <OrderSummary />
      </div>
    </div>
  );
}
