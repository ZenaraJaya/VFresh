'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { homeForRole } from '@/lib/home-for-role';
import ProfileAvatar from '@/components/shared/ui/ProfileAvatar';

function signedInNav(user: {
  role?: string;
  vendorStatus?: string;
  name?: string | null;
}) {
  const role = user.role;
  if (role === 'CUSTOMER') {
    return { href: '/account', label: user.name || 'Account' };
  }
  if (role === 'ADMIN') return { href: '/admin/profile', label: user.name || 'Admin' };
  if (role === 'VENDOR') {
    return {
      href: homeForRole('VENDOR', user.vendorStatus),
      label: user.name || 'Vendor',
    };
  }
  if (role === 'DELIVERY') return { href: '/delivery/profile', label: user.name || 'Delivery' };
  return null;
}

export default function HeaderAuth() {
  const { data, status } = useSession();

  if (status === 'loading') {
    return (
      <span className="hidden h-11 w-28 rounded-xl bg-neutral-100 lg:block dark:bg-neutral-800" />
    );
  }

  const nav = data?.user ? signedInNav(data.user) : null;

  if (nav) {
    const isCustomer = data?.user?.role === 'CUSTOMER';
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Link
          href={nav.href}
          className="flex min-h-11 max-w-[14rem] items-center gap-2 rounded-xl border border-neutral-200 px-2.5 py-1.5 text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <ProfileAvatar
            src={data?.user?.image}
            name={data?.user?.name}
            size={32}
          />
          <span className="truncate text-sm font-medium">{nav.label}</span>
        </Link>
        {isCustomer ? null : (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="min-h-11 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            Sign out
          </button>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="hidden min-h-11 items-center rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 lg:inline-flex dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
    >
      Login / Register
    </Link>
  );
}

export function HeaderAuthMobile({ onNavigate }: { onNavigate: () => void }) {
  const { data, status } = useSession();

  if (status === 'loading') return null;

  const nav = data?.user ? signedInNav(data.user) : null;

  if (nav) {
    const isCustomer = data?.user?.role === 'CUSTOMER';
    return (
      <div className={isCustomer ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-2'}>
        <Link
          href={nav.href}
          onClick={onNavigate}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-medium text-white"
        >
          <ProfileAvatar
            src={data?.user?.image}
            name={data?.user?.name}
            size={28}
          />
          <span className="truncate">{nav.label}</span>
        </Link>
        {isCustomer ? null : (
          <button
            type="button"
            onClick={() => {
              onNavigate();
              void signOut({ callbackUrl: '/' });
            }}
            className="min-h-11 rounded-xl border border-neutral-200 px-3 py-2.5 text-center text-sm font-medium dark:border-neutral-700"
          >
            Sign out
          </button>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-medium text-white"
    >
      Login / Register
    </Link>
  );
}
