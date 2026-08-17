import SiteShell from '@/components/customer/layout/SiteShell';
import HeroSection from '@/components/customer/sections/HeroSection';
import HomeCatalog from '@/components/customer/sections/HomeCatalog';
import AboutSection from '@/components/customer/sections/AboutSection';
import LocationSection from '@/components/customer/sections/LocationSection';
import ReviewSection from '@/components/customer/sections/ReviewSection';
import { prisma } from '@/lib/db';
import { storefrontWhere, VENDOR_PUBLIC_SELECT } from '@/lib/public-menu';
import {
  isMenuFromOpenVendor,
  sortVendorsOpenFirst,
  VENDOR_HOURS_SELECT,
} from '@/lib/vendor-availability';
import { withPublicPackQty } from '@/lib/daily-pack';
import type { MenuItem, VendorPublic } from '@/types';

export const dynamic = 'force-dynamic';

function mapItem(item: {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badges: unknown;
  available: boolean;
  remainingQty: number | null;
  vendorId: string | null;
  vendor: {
    id: string;
    businessName: string;
    slug: string;
    isOpen: boolean;
    scheduleMode: string;
    closesAt: Date | null;
    closedUntil: Date | null;
    openTime: string | null;
    closeTime: string | null;
    weeklyHours: unknown;
  } | null;
}): MenuItem {
  return {
    ...item,
    badges: Array.isArray(item.badges) ? (item.badges as string[]) : [],
  };
}

export default async function Home() {
  let featured: MenuItem[] = [];
  let vendors: VendorPublic[] = [];
  let loadError = false;

  try {
    const [featuredRaw, vendorsRaw] = await Promise.all([
      prisma.menuItem.findMany({
        where: await storefrontWhere({ vendor: { status: 'APPROVED' } }),
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
        orderBy: { createdAt: 'desc' },
        take: 48,
      }),
      prisma.vendor.findMany({
        where: { status: 'APPROVED' },
        orderBy: { businessName: 'asc' },
        select: VENDOR_PUBLIC_SELECT,
      }),
    ]);

    const withBadges = (await withPublicPackQty(featuredRaw))
      .map(mapItem)
      .filter(isMenuFromOpenVendor);
    featured = withBadges;
    vendors = sortVendorsOpenFirst(vendorsRaw as VendorPublic[]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Home page data failed', message);
    loadError = true;
  }

  return (
    <SiteShell>
      <HeroSection />
      {loadError ? (
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center dark:border-amber-900 dark:bg-amber-950/40">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              The menu could not be loaded right now.
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              Refresh in a few seconds — the kitchens are still in the database.
            </p>
          </div>
        </div>
      ) : (
        <HomeCatalog items={featured} vendors={vendors} />
      )}
      <AboutSection />
      <LocationSection />
      <ReviewSection />
    </SiteShell>
  );
}
