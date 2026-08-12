import Link from 'next/link';
import { Store } from 'lucide-react';
import SiteShell from '@/components/customer/layout/SiteShell';
import { prisma } from '@/lib/db';
import {
  isVendorAcceptingOrders,
  sortVendorsOpenFirst,
  vendorClosedLabel,
  VENDOR_HOURS_SELECT,
} from '@/lib/vendor-availability';

export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  const vendorsRaw = await prisma.vendor.findMany({
    where: { status: 'APPROVED' },
    orderBy: { businessName: 'asc' },
    select: {
      id: true,
      businessName: true,
      slug: true,
      description: true,
      address: true,
      ...VENDOR_HOURS_SELECT,
      _count: { select: { menuItems: { where: { available: true } } } },
    },
  });
  const vendors = sortVendorsOpenFirst(vendorsRaw);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="mt-1 text-neutral-500">
            Choose a kitchen and browse their menu.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => {
            const accepting = isVendorAcceptingOrders({
              ...v,
              status: 'APPROVED',
            });
            const closedLabel = vendorClosedLabel(v);

            return (
              <Link
                key={v.id}
                href={`/vendors/${v.slug}`}
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
                    <Store className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      accepting
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {accepting ? 'Open' : 'Closed'}
                  </span>
                </div>
                <h2 className="font-semibold">{v.businessName}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                  {v.description || v.address || 'VFresh kitchen partner'}
                </p>
                <p className="mt-3 text-xs font-medium text-emerald-600">
                  {v._count.menuItems} items
                </p>
                {closedLabel && (
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    {closedLabel}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </SiteShell>
  );
}
