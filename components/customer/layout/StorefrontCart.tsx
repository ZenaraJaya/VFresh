'use client';

import { CartProvider } from '@/context/CartContext';
import PaymentHoldAlert from '@/components/customer/orders/PaymentHoldAlert';

/** Cart + payment-hold alert for the storefront. Auth session comes from root Providers. */
export default function StorefrontCart({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <PaymentHoldAlert />
      {children}
    </CartProvider>
  );
}
