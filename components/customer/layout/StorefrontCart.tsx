'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';

/** Same Session + Cart instances for header, cart, and account pages. */
export default function StorefrontCart({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
