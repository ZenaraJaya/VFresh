'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/account/orders', label: 'Order list', exact: true },
  { href: '/account/orders/history', label: 'History' },
  { href: '/account/orders/payment', label: 'Payment method' },
  { href: '/account/orders/schedule', label: 'Scheduled' },
];

export default function OrdersSubnav() {
  const pathname = usePathname();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              active
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
