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

const LG = 1024;

export default function Header() {
  const { count, hydrated } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const closeMenu = () => setMobileOpen(false);

  useEffect(() => {
    closeMenu();
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
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      <ScrollToHash />
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
        <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <HomeHashLink
            hash="home"
            onNavigate={closeMenu}
            className="flex items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">VFresh</span>
          </HomeHashLink>

          <Navigation />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setCartOpen(true);
              }}
              aria-label="Open cart"
              className="relative rounded-xl p-2 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <ShoppingBag className="h-5 w-5" />
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
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
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="rounded-xl p-2 transition hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {mobileOpen ? (
            <div className="lg:hidden">
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-x-0 top-16 bottom-0 z-40 bg-black/25"
                onClick={closeMenu}
              />
              <div className="absolute right-4 top-full z-50 mt-2 w-[min(17.5rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                <Navigation vertical onNavigate={closeMenu} />
                <div className="mt-1 border-t border-neutral-200 p-2 dark:border-neutral-800">
                  <HeaderAuthMobile onNavigate={closeMenu} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
