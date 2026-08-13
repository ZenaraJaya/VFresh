'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function HeaderAuth() {
  const { data, status } = useSession();
  const customer = data?.user?.role === 'CUSTOMER';

  if (status === 'loading') {
    return (
      <span className="hidden h-9 w-24 rounded-xl bg-neutral-100 lg:block dark:bg-neutral-800" />
    );
  }

  if (customer) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Link
          href="/account"
          className="max-w-[9rem] truncate text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {data.user.name || 'Account'}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="hidden rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium transition hover:bg-neutral-50 lg:inline-flex dark:border-neutral-700 dark:hover:bg-neutral-800"
    >
      Login / Register
    </Link>
  );
}

export function HeaderAuthMobile({ onNavigate }: { onNavigate: () => void }) {
  const { data, status } = useSession();
  const customer = data?.user?.role === 'CUSTOMER';

  if (status === 'loading') return null;

  if (customer) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/account"
          onClick={onNavigate}
          className="rounded-xl bg-emerald-500 px-3 py-2.5 text-center text-sm font-medium text-white"
        >
          Account
        </Link>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            void signOut({ callbackUrl: '/' });
          }}
          className="rounded-xl border border-neutral-200 px-3 py-2.5 text-center text-sm font-medium dark:border-neutral-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      onClick={onNavigate}
      className="block rounded-xl bg-emerald-500 px-3 py-2.5 text-center text-sm font-medium text-white"
    >
      Login / Register
    </Link>
  );
}
