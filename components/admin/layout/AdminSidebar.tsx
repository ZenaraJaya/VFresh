'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Leaf,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
];

const VENDOR_LINKS = [
  { href: '/admin/vendors', label: 'All vendors', exact: true },
  { href: '/admin/vendors/menu', label: 'Menu review' },
];

const COMPANY_LINKS = [
  { href: '/admin/companies', label: 'All companies', exact: true },
  { href: '/admin/billing', label: 'Billing' },
];

function navClass(active: boolean) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
    active
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
      : 'text-neutral-800 hover:bg-white hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
  }`;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const vendorsOpen =
    pathname === '/admin/vendors' ||
    pathname.startsWith('/admin/vendors/') ||
    pathname.startsWith('/admin/menu');
  const companiesOpen =
    pathname.startsWith('/admin/companies') ||
    pathname.startsWith('/admin/billing');

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5 dark:border-neutral-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <Leaf className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
            VFresh
          </p>
          <p className="text-sm font-bold leading-tight">Operations</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {LINKS.slice(0, 1).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={navClass(pathname === link.href)}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}

        <div className="pt-1">
          <Link href="/admin/vendors" className={navClass(vendorsOpen)}>
            <Store className="h-4 w-4" />
            Vendors
          </Link>
          <div className="ml-4 space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
            {VENDOR_LINKS.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={navClass(active)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/admin/orders"
          className={navClass(pathname.startsWith('/admin/orders'))}
        >
          <ShoppingCart className="h-4 w-4" />
          Orders
        </Link>

        <div className="pt-1">
          <Link href="/admin/companies" className={navClass(companiesOpen)}>
            <Building2 className="h-4 w-4" />
            Companies
          </Link>
          <div className="ml-4 space-y-1 border-l border-neutral-200 pl-3 dark:border-neutral-800">
            {COMPANY_LINKS.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={navClass(active)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/admin/admins"
          className={navClass(pathname.startsWith('/admin/admins'))}
        >
          <Users className="h-4 w-4" />
          Team
        </Link>
      </nav>
    </aside>
  );
}
