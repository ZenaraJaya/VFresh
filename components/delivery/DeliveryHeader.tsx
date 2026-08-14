'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike, UserRound } from 'lucide-react';
import NotificationBell from '@/components/delivery/NotificationBell';

export default function DeliveryHeader({ name }: { name: string }) {
  const pathname = usePathname();
  const onProfile = pathname.startsWith('/delivery/profile');

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/delivery" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <Bike className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-semibold">Delivery</span>
        </Link>

        <div className="flex items-center gap-1">
          <NotificationBell />
          <Link
            href="/delivery/profile"
            className={`inline-flex max-w-[14rem] items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium ${
              onProfile
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                : 'text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-neutral-300'
            }`}
          >
            <UserRound className="h-4 w-4 shrink-0" />
            <span className="truncate">{name}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
