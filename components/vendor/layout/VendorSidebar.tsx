'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  UserRound,
  Store,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { isVendorAcceptingOrders, type VendorHours } from '@/lib/vendor-availability';
import { useLivePoll } from '@/lib/use-live-poll';
import { useState } from 'react';

const NAV = [
  { href: '/vendor', label: 'Home', icon: LayoutDashboard },
  { href: '/vendor/orders', label: 'Orders', icon: ClipboardList },
  { href: '/vendor/menu', label: 'Dishes', icon: UtensilsCrossed },
  { href: '/vendor/store', label: 'Store', icon: Store },
  { href: '/vendor/profile', label: 'Profile', icon: UserRound },
];

export default function VendorSidebar({
  businessName,
  slug,
  status,
  logo,
  hours,
}: {
  businessName: string;
  slug: string;
  status: string;
  logo?: string | null;
  hours: VendorHours;
}) {
  const pathname = usePathname();
  const initial = businessName.trim().charAt(0).toUpperCase() || 'V';
  const [accepting, setAccepting] = useState(() =>
    isVendorAcceptingOrders({
      ...hours,
      status,
    })
  );

  useLivePoll(async () => {
    const res = await fetch('/api/vendor/availability', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (typeof data.accepting === 'boolean') setAccepting(data.accepting);
  }, 8000);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex">
      <div className="px-6 pb-6 pt-8">
        <div className="flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-snug">
              {businessName}
            </p>
            <p
              className={`mt-1 text-sm ${
                accepting ? 'text-emerald-600' : 'text-amber-700'
              }`}
            >
              {accepting ? 'Open' : 'Closed'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/vendor'
              ? pathname === '/vendor'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                active
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-neutral-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-8">
        <Link
          href={`/vendors/${slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-emerald-700"
        >
          <ExternalLink className="h-4 w-4" />
          View store
        </Link>
      </div>
    </aside>
  );
}
