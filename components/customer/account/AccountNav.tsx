'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  CreditCard,
  FileText,
  ClipboardList,
  LogOut,
  UserRound,
} from 'lucide-react';

const LINKS = [
  {
    href: '/account',
    label: 'Profile',
    icon: UserRound,
    match: (p: string) => p === '/account',
  },
  {
    href: '/account/orders',
    label: 'Orders',
    icon: ClipboardList,
    match: (p: string) => p.startsWith('/account/orders'),
  },
  {
    href: '/account/billing',
    label: 'Billing',
    icon: CreditCard,
    match: (p: string) =>
      p.startsWith('/account/billing') || p.startsWith('/account/payments'),
  },
  {
    href: '/account/invoices',
    label: 'Invoices',
    icon: FileText,
    match: (p: string) => p.startsWith('/account/invoices'),
  },
];

export default function AccountNav({
  name,
  email,
  company,
}: {
  name: string;
  email: string;
  company: string | null;
}) {
  const pathname = usePathname();
  const initial = (name.trim().charAt(0) || email.charAt(0) || 'A').toUpperCase();

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-neutral-900 dark:text-white">
            {name || 'Account'}
          </p>
          <p className="truncate text-xs text-neutral-500">{email}</p>
          {company ? (
            <p className="mt-1 truncate text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {company}
            </p>
          ) : null}
        </div>
      </div>

      <nav className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => {
          const active = link.match(pathname);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-white hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="mt-4 flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  );
}
