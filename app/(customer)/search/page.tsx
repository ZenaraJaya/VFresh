import MenuCard from '@/components/customer/menu/MenuCard';
import VendorCard from '@/components/customer/vendors/VendorCard';
import { prisma } from '@/lib/db';
import {
  sortMenuOpenFirst,
  sortVendorsOpenFirst,
  VENDOR_HOURS_SELECT,
  VENDOR_PUBLIC_SELECT,
} from '@/lib/vendor-availability';
import type { MenuItem, VendorPublic } from '@/types';
import { withPublicPackQty } from '@/lib/daily-pack';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw = '' } = await searchParams;
  const q = raw.trim();

  const [foods, vendors] = q
    ? await Promise.all([
        prisma.menuItem.findMany({
          where: {
            available: true,
            vendor: { status: 'APPROVED' },
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { category: { contains: q, mode: 'insensitive' } },
              {
                vendor: {
                  businessName: { contains: q, mode: 'insensitive' },
                },
              },
            ],
          },
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
          take: 24,
        }),
        prisma.vendor.findMany({
          where: {
            status: 'APPROVED',
            OR: [
              { businessName: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 12,
          select: VENDOR_PUBLIC_SELECT,
        }),
      ])
    : [[], []];

  const items: MenuItem[] = sortMenuOpenFirst(
    await withPublicPackQty(
      foods.map((item) => ({
        ...item,
        badges: Array.isArray(item.badges) ? (item.badges as string[]) : [],
      }))
    )
  );
  const vendorsSorted = sortVendorsOpenFirst(vendors as VendorPublic[]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Search</h1>
          <p className="mt-1 text-neutral-500">
            {q ? (
              <>
                Results for <span className="font-medium text-neutral-800 dark:text-neutral-200">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              'Type a food or vendor name in the home search bar.'
            )}
          </p>
        </div>

        {q && (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Vendors ({vendorsSorted.length})</h2>
              {vendorsSorted.length === 0 ? (
                <p className="text-sm text-neutral-500">No vendors matched.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {vendorsSorted.map((v) => (
                    <VendorCard key={v.id} vendor={v} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Food ({items.length})</h2>
              {items.length === 0 ? (
                <p className="text-sm text-neutral-500">No dishes matched.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
  );
}
