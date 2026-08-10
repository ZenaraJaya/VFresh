'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ExternalLink, LogOut } from 'lucide-react';

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 dark:border-neutral-800 dark:bg-neutral-900">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-emerald-600 dark:text-neutral-400"
      >
        View storefront
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">
              {session.user.name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {session.user.email}
            </p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
