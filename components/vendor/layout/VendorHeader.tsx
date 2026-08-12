'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Store,
  UtensilsCrossed,
} from 'lucide-react';

const links = [
  { href: '/vendor', label: 'Dashboard', exact: true },
  { href: '/vendor/menu', label: 'Menu' },
  { href: '/vendor/profile', label: 'Profile' },
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
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white">
            {businessName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{businessName}</p>
            <p className="truncate text-xs text-neutral-500">{email}</p>
          </div>
        </div>

        <div className="hidden min-w-0 lg:block">
          <p className="text-sm font-medium text-neutral-900 dark:text-white">
            Kitchen workspace
          </p>
          <p className="text-xs text-neutral-500">{email}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/vendors/${slug}`}
            className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:border-emerald-300 hover:text-emerald-700 sm:inline-flex dark:border-neutral-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View page
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-neutral-100 px-3 py-2 lg:hidden dark:border-neutral-800">
        {links.map(({ href, label, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);
          const Icon =
            href === '/vendor'
              ? LayoutDashboard
              : href === '/vendor/menu'
                ? UtensilsCrossed
                : Store;
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                active
                  ? 'bg-emerald-500 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
