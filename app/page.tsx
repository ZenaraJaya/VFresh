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

    // Favourites: open vendors only. Prefer BESTSELLER, then newest.
    const withBadges = featuredRaw.map(mapItem).filter(isMenuFromOpenVendor);
    const bestsellers = withBadges.filter((i) =>
      i.badges.includes('BESTSELLER')
    );
    const rest = withBadges.filter((i) => !i.badges.includes('BESTSELLER'));
    featured = [...bestsellers, ...rest].slice(0, 6);
    vendors = sortVendorsOpenFirst(vendorsRaw as VendorPublic[]).slice(0, 6);
  } catch (err) {
    console.error('Home page data failed', err);
  }

  return (
    <SiteShell>
      <HeroSection />
      <HomeSearch />
      <MenuSection items={featured} />
      <VendorsSection vendors={vendors} />
      <AboutSection />
      <IngredientsSection />
      <LocationSection />
      <ReviewSection />
    </SiteShell>
  );
}
