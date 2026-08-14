import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Phone } from 'lucide-react';
import VendorLogo from '@/components/customer/vendors/VendorLogo';
import VendorMenuList from '@/components/customer/vendors/VendorMenuList';
import { prisma } from '@/lib/db';
import {
  formatVendorSchedule,
  isVendorAcceptingOrders,
  vendorClosedLabel,
  vendorOpenBadge,
  VENDOR_HOURS_SELECT,
} from '@/lib/vendor-availability';
import type { MenuItem } from '@/types';
import { withPublicPackQty } from '@/lib/daily-pack';

export const dynamic = 'force-dynamic';

export default async function VendorStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const vendor = await prisma.vendor.findFirst({
    where: { slug, status: 'APPROVED' },
  });
  if (!vendor) notFound();

  const accepting = isVendorAcceptingOrders(vendor);
  const badge = vendorOpenBadge(vendor);
  const closedLabel = vendorClosedLabel(vendor);
  const hours = formatVendorSchedule(vendor);

  const foods = await prisma.menuItem.findMany({
    where: { vendorId: vendor.id, available: true },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          ...VENDOR_HOURS_SELECT,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const items: MenuItem[] = await withPublicPackQty(
    foods.map((item) => ({
      ...item,
      badges: Array.isArray(item.badges) ? (item.badges as string[]) : [],
    }))
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <Link
        href="/vendors"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-emerald-600 dark:text-neutral-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vendors
      </Link>

      <header className="flex flex-col gap-6 border-b border-neutral-200 pb-8 dark:border-neutral-800 sm:flex-row sm:items-start">
        <VendorLogo
          src={vendor.logo}
          name={vendor.businessName}
          className="h-24 w-24 shrink-0 rounded-2xl sm:h-28 sm:w-28"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {vendor.businessName}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                accepting
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {badge === 'Open' ? 'Open' : badge === 'Lunch' ? 'Lunch break' : 'Temporarily closed'}
            </span>
          </div>
          {vendor.description && (
            <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
              {vendor.description}
            </p>
          )}
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            {vendor.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{vendor.address}</span>
              </div>
            )}
            {hours && (
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{hours}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{vendor.phone}</span>
              </div>
            )}
          </dl>
          {closedLabel && (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {closedLabel}
            </p>
          )}
        </div>
      </header>

      <VendorMenuList items={items} />
    </div>
  );
}
