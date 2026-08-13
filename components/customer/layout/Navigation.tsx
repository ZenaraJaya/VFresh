'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/#about', label: 'How it works' },
  { href: '/#ingredients', label: 'Ingredients' },
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
          ? 'flex flex-col gap-1'
          : 'hidden items-center gap-0.5 md:flex'
      }
    >
      {NAV_LINKS.map((link) => {
        const active = isActive(link.href, pathname);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition ${
              active
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
