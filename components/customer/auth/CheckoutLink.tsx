'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

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
  const href =
    status !== 'loading' && data?.user?.role === 'CUSTOMER'
      ? '/checkout'
      : '/login?callbackUrl=/checkout';

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
