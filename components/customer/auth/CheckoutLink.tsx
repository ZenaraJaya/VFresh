'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import CheckoutAuthModal from './CheckoutAuthModal';

export default function CheckoutLink({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { data, status } = useSession();
  const signedIn = status !== 'loading' && data?.user?.role === 'CUSTOMER';
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <Link
        href="/checkout"
        className={className}
        onClick={(e) => {
          if (signedIn) {
            onClick?.();
            return;
          }
          e.preventDefault();
          setAuthOpen(true);
        }}
      >
        {children}
      </Link>
      <CheckoutAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => {
          setAuthOpen(false);
          onClick?.();
        }}
      />
    </>
  );
}
