'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  UserRound,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { isVendorAcceptingOrders, type VendorHours } from '@/lib/vendor-availability';

const NAV = [
  { href: '/vendor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/menu', label: 'Menu', icon: UtensilsCrossed },
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
  const accepting = isVendorAcceptingOrders({
    ...hours,
    status,
  });

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex lg:flex-col">
      <div className="border-b border-neutral-200 p-5 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="h-11 w-11 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{businessName}</p>
            {status === 'APPROVED' && (
              <span className="mt-0.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Approved
              </span>
            )}
          </div>
        </div>
        <p
          className={`mt-3 text-xs font-medium ${
            accepting ? 'text-emerald-600' : 'text-amber-700'
          }`}
        >
          {accepting ? 'Accepting orders' : 'Temporarily closed'}
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/vendor'
              ? pathname === '/vendor'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <Link
          href={`/vendors/${slug}`}
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <ExternalLink className="h-4 w-4" />
          Public storefront
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
