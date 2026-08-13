'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/account', label: 'Profile', match: (p: string) => p === '/account' },
  {
    href: '/account/orders',
    label: 'Orders',
    match: (p: string) => p.startsWith('/account/orders'),
  },
  {
    href: '/account/invoices',
    label: 'Invoices',
    match: (p: string) => p.startsWith('/account/invoices'),
  },
  {
    href: '/account/payments',
    label: 'Payments',
    match: (p: string) => p.startsWith('/account/payments'),
  },
];

export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px dark:border-neutral-800">
      {LINKS.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium ${
              active
                ? 'border-b-2 border-emerald-600 text-emerald-800 dark:text-emerald-300'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
