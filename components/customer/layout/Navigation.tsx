'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/cart', label: 'Cart' },
  { href: '/#about', label: 'About' },
  { href: '/#location', label: 'Locations' },
  { href: '/login', label: 'Login' },
];

interface NavigationProps {
  /** Stacked layout for the mobile drawer. */
  vertical?: boolean;
  onNavigate?: () => void;
}

export default function Navigation({ vertical, onNavigate }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={
        vertical ? 'flex flex-col gap-1' : 'hidden items-center gap-1 md:flex'
      }
    >
      {NAV_LINKS.map((link) => {
        // Hash links all live on the landing page, so only compare the path part.
        const isActive =
          link.href === '/'
            ? pathname === '/'
            : pathname === link.href.split('#')[0] && !link.href.includes('#');

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
