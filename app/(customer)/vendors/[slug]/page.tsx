import { notFound } from 'next/navigation';
import { Clock, MapPin, Phone } from 'lucide-react';
import MenuCard from '@/components/customer/menu/MenuCard';
import VendorLogo from '@/components/customer/vendors/VendorLogo';
import { prisma } from '@/lib/db';
import {
  formatVendorSchedule,
  isVendorAcceptingOrders,
  vendorClosedLabel,
  VENDOR_HOURS_SELECT,
} from '@/lib/vendor-availability';
import type { MenuItem } from '@/types';

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

  const items: MenuItem[] = foods.map((item) => ({
    ...item,
    badges: Array.isArray(item.badges) ? (item.badges as string[]) : [],
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative h-44 bg-neutral-100 sm:h-56 dark:bg-neutral-800">
          {vendor.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.logo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <VendorLogo
                src={null}
                name={vendor.businessName}
                className="h-20 w-20"
              />
            </div>
          )}
        </div>
        <div className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Vendor
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                accepting
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {accepting ? 'Open' : 'Temporarily closed'}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {vendor.businessName}
          </h1>
          {vendor.description && (
            <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
              {vendor.description}
            </p>
          )}
          <div className="flex flex-col gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            {vendor.address && (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {vendor.address}
              </p>
            )}
            {hours && (
              <p className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {hours}
              </p>
            )}
            {vendor.phone && (
              <p className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {vendor.phone}
              </p>
            )}
          </div>
          {closedLabel && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {closedLabel}
            </p>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-neutral-500">No menu items yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
