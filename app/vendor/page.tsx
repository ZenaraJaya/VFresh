import Link from 'next/link';
import {
  ArrowUpRight,
  ExternalLink,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { requireVendor } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';
import { isVendorAcceptingOrders } from '@/lib/vendor-availability';
import VendorAvailabilityPanel from '@/components/vendor/availability/VendorAvailabilityPanel';

export default async function VendorDashboardPage() {
  const session = await requireVendor();

  const [vendor, menuCount, availableCount] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: session.user.id } }),
    prisma.menuItem.count({ where: { vendorId: session.user.id } }),
    prisma.menuItem.count({
      where: { vendorId: session.user.id, available: true },
    }),
  ]);

  if (!vendor) return null;

  const accepting = isVendorAcceptingOrders(vendor);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Welcome back — manage your menu and storefront.
          </p>
        </div>
        <Link
          href={`/vendors/${vendor.slug}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600"
        >
          Open public page
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <VendorAvailabilityPanel />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Orders',
            value: accepting ? 'Accepting' : 'Paused',
            hint: accepting
              ? 'Customers can place orders'
              : 'Store temporarily closed',
          },
          {
            label: 'Menu items',
            value: String(menuCount),
            hint: 'Total dishes in your catalogue',
          },
          {
            label: 'Live on site',
            value: String(availableCount),
            hint: 'Visible to customers now',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
              {card.hint}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/vendor/menu"
          className="group flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Manage menu</h2>
              <ArrowUpRight className="h-4 w-4 text-neutral-400 transition group-hover:text-emerald-600" />
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Add, edit, or hide dishes customers can order.
            </p>
          </div>
        </Link>
        <Link
          href="/vendor/profile"
          className="group flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
            <Store className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Store profile</h2>
              <ArrowUpRight className="h-4 w-4 text-neutral-400 transition group-hover:text-emerald-600" />
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Business details, address, and premises type.
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
