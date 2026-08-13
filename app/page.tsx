import SiteShell from '@/components/customer/layout/SiteShell';
import HeroSection from '@/components/customer/sections/HeroSection';
import HomeSearch from '@/components/customer/sections/HomeSearch';
import MenuSection from '@/components/customer/sections/MenuSection';
import VendorsSection from '@/components/customer/sections/VendorsSection';
import AboutSection from '@/components/customer/sections/AboutSection';
import IngredientsSection from '@/components/customer/sections/IngredientsSection';
import LocationSection from '@/components/customer/sections/LocationSection';
import ReviewSection from '@/components/customer/sections/ReviewSection';
import { prisma } from '@/lib/db';
import {
  isMenuFromOpenVendor,
  sortVendorsOpenFirst,
  VENDOR_HOURS_SELECT,
} from '@/lib/vendor-availability';
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
        where: { available: true, vendor: { status: 'APPROVED' } },
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
        select: {
          id: true,
          businessName: true,
          slug: true,
          description: true,
          logo: true,
          phone: true,
          address: true,
          ...VENDOR_HOURS_SELECT,
          _count: { select: { menuItems: { where: { available: true } } } },
        },
      }),
    ]);

    const withBadges = featuredRaw.map(mapItem).filter(isMenuFromOpenVendor);
    const bestsellers = withBadges.filter((i) =>
      i.badges.includes('BESTSELLER')
    );
    const rest = withBadges.filter((i) => !i.badges.includes('BESTSELLER'));
    featured = [...bestsellers, ...rest].slice(0, 6);
    vendors = sortVendorsOpenFirst(vendorsRaw as VendorPublic[]).slice(0, 6);
  } catch (err) {
    console.error('Home page data failed', err);
    loadError = true;
  }

  return (
    <SiteShell>
      <HeroSection />
      <HomeSearch />
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
        <>
          <MenuSection items={featured} />
          <VendorsSection vendors={vendors} />
        </>
      )}
      <AboutSection />
      <IngredientsSection />
      <LocationSection />
      <ReviewSection />
    </SiteShell>
  );
}
