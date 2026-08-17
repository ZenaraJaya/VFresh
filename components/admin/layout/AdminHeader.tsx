import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ui/ProfileAvatar';

export default function AdminHeader({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="hidden text-sm text-neutral-500 sm:block dark:text-neutral-400">
        Vendor review, company billing, and storefront quality
      </p>
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          Storefront
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        {email ? (
          <Link
            href="/admin/profile"
            className="flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 px-2.5 py-1.5 text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <ProfileAvatar src={image} name={name} size={32} />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight">
                {name || 'Admin'}
              </span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                {email}
              </span>
            </span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
