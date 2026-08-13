'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/order-confirmation', label: 'Track order' },
  { href: '/#location', label: 'Locations' },
];

function isActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href === '/menu') {
    return pathname === '/menu' || pathname.startsWith('/menu/');
  }
  if (href === '/vendors') {
    return pathname === '/vendors' || pathname.startsWith('/vendors/');
  }
  if (href === '/order-confirmation') {
    return pathname.startsWith('/order-confirmation');
  }
  return false;
}

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
        vertical
          ? 'grid grid-cols-1 gap-1'
          : 'hidden lg:grid lg:grid-cols-5 lg:items-center lg:gap-1'
      }
    >
      {NAV_LINKS.map((link) => {
        const active = isActive(link.href, pathname);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium ${
              vertical ? 'justify-start' : 'justify-center text-center'
            } ${
              active
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                : 'text-neutral-600 hover:bg-emerald-50 hover:text-emerald-800 dark:text-neutral-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
