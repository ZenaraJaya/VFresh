'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Leaf, Menu as MenuIcon, ShoppingBag, X } from 'lucide-react';
import HeaderAuth, { HeaderAuthMobile } from './HeaderAuth';
import Navigation from './Navigation';
import ScrollToHash from './ScrollToHash';
import HomeHashLink from './HomeHashLink';
import CartSidebar from '@/components/customer/cart/CartSidebar';
import { useCart } from '@/context/CartContext';
import { lockBodyScroll } from '@/lib/body-scroll-lock';

const LG = 1024;

export default function Header() {
  const { count, hydrated } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);
  const openCart = () => {
    closeMenu();
    setCartOpen(true);
  };

  useEffect(() => {
    closeMenu();
    setCartOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= LG) closeMenu();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlock();
    };
  }, [mobileOpen]);

  const cartCount = hydrated ? count : 0;

  return (
    <>
      <ScrollToHash />
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <HomeHashLink
            hash="home"
            onNavigate={closeMenu}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">VFresh</span>
          </HomeHashLink>

          <Navigation />

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openCart}
              aria-label={cartCount > 0 ? `Open cart, ${cartCount} items` : 'Open cart'}
              className="relative inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-sm font-medium transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>

            <HeaderAuth />

            <HomeHashLink
              hash="menu"
              className="hidden rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 lg:block"
            >
              Order now
            </HomeHashLink>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:bg-neutral-100 lg:hidden dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={closeMenu}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            className="absolute inset-y-0 right-0 flex w-[min(20rem,100%)] flex-col bg-white shadow-2xl dark:bg-neutral-950"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h2 id="mobile-menu-title" className="text-base font-semibold">
                Menu
              </h2>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <Navigation vertical onNavigate={closeMenu} />
            </div>

            <div className="space-y-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
              <button
                type="button"
                onClick={openCart}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-700 dark:hover:bg-emerald-950/40"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  Cart
                </span>
                {cartCount > 0 ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-neutral-400">Empty</span>
                )}
              </button>
              <HeaderAuthMobile onNavigate={closeMenu} />
            </div>
          </div>
        </div>
      ) : null}

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
