'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Leaf, Menu as MenuIcon, ShoppingBag, X } from 'lucide-react';
import Navigation from './Navigation';
import CartSidebar from '@/components/customer/cart/CartSidebar';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { count, hydrated } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">VFresh</span>
          </Link>

          <Navigation />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative rounded-xl p-2 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ShoppingBag className="h-5 w-5" />
              {/* Suppress the badge until the stored cart is read, so SSR and
                  the first client render agree. */}
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>

            <Link
              href="/menu"
              className="hidden rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 sm:block"
            >
              Order now
            </Link>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="rounded-xl p-2 transition hover:bg-neutral-100 md:hidden dark:hover:bg-neutral-800"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-neutral-200 px-4 py-3 md:hidden dark:border-neutral-800">
            <Navigation vertical onNavigate={() => setMobileOpen(false)} />
          </div>
        )}
      </header>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
