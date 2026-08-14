'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const CHECKOUT_LOGIN_MESSAGE =
  'Please sign in to continue checkout. After you sign in, you can set delivery and payment.';

export default function CheckoutLink({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  const { data, status } = useSession();
  const signedIn = status !== 'loading' && data?.user?.role === 'CUSTOMER';

  return (
    <Link
      href={signedIn ? '/checkout' : '/login?callbackUrl=/checkout'}
      className={className}
      onClick={(e) => {
        onClick?.();
        if (signedIn) return;
        e.preventDefault();
        window.alert(CHECKOUT_LOGIN_MESSAGE);
        router.push('/login?callbackUrl=/checkout');
      }}
    >
      {children}
    </Link>
  );
}
