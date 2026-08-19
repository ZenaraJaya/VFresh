'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import PaymentHoldAlert from '@/components/customer/orders/PaymentHoldAlert';

/** Same Session + Cart instances for header, cart, and account pages. */
export default function StorefrontCart({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus>
      <CartProvider>
        <PaymentHoldAlert />
        {children}
      </CartProvider>
    </SessionProvider>
  );
}
