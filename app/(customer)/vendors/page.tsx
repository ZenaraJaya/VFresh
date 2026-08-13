import { prisma } from '@/lib/db';
import {
  sortVendorsOpenFirst,
  VENDOR_PUBLIC_SELECT,
} from '@/lib/vendor-availability';
import VendorCard from '@/components/customer/vendors/VendorCard';
import type { VendorPublic } from '@/types';

export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  const vendorsRaw = await prisma.vendor.findMany({
    where: { status: 'APPROVED' },
    orderBy: { businessName: 'asc' },
    select: VENDOR_PUBLIC_SELECT,
  });
  const vendors = sortVendorsOpenFirst(vendorsRaw as VendorPublic[]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <p className="mt-1 text-neutral-500">
          Location, hours, and menus from kitchens on VFresh.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>
    </div>
  );
}
