'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/context/CartContext';
import SessionIdleGuard from '@/components/auth/SessionIdleGuard';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus>
      <SessionIdleGuard />
      <CartProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: '0.75rem',
              background: '#171717',
              color: '#fafafa',
            },
          }}
        />
      </CartProvider>
    </SessionProvider>
  );
}
