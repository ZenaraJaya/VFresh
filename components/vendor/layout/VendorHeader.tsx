'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bike,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  Store,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';

const links = [
  { href: '/vendor', label: 'Home', exact: true, icon: LayoutDashboard },
  { href: '/vendor/orders', label: 'Orders', icon: ClipboardList },
  { href: '/vendor/delivery', label: 'Delivery', icon: Bike },
  { href: '/vendor/menu', label: 'Dishes', icon: UtensilsCrossed },
  { href: '/vendor/store', label: 'Store', icon: Store },
  { href: '/vendor/profile', label: 'Profile', icon: UserRound },
];

export default function VendorHeader({
  businessName,
  email,
  slug,
}: {
  businessName: string;
  email: string;
  slug: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
            {businessName.charAt(0).toUpperCase()}
          </span>
          <p className="truncate text-sm font-semibold">{businessName}</p>
        </div>

        <p className="hidden truncate text-sm text-neutral-500 lg:block">
          {email}
        </p>

        <Link
          href={`/vendors/${slug}`}
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-neutral-500 hover:text-emerald-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View store
        </Link>
      </div>

      <nav className="grid grid-cols-6 gap-1 border-t border-neutral-100 px-2 py-2 lg:hidden dark:border-neutral-800">
        {links.map(({ href, label, exact, icon: Icon }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-semibold ${
                active
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-neutral-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
