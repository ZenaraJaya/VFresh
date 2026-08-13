import { notFound } from 'next/navigation';
import MenuCard from '@/components/customer/menu/MenuCard';
import { prisma } from '@/lib/db';
import {
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
        <div>
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
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {vendor.businessName}
          </h1>
          {vendor.description && (
            <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">
              {vendor.description}
            </p>
          )}
          {closedLabel && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {closedLabel}
            </p>
          )}
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
