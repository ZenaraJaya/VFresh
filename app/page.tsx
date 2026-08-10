import SiteShell from '@/components/customer/layout/SiteShell';
import HeroSection from '@/components/customer/sections/HeroSection';
import MenuSection from '@/components/customer/sections/MenuSection';
import AboutSection from '@/components/customer/sections/AboutSection';
import IngredientsSection from '@/components/customer/sections/IngredientsSection';
import LocationSection from '@/components/customer/sections/LocationSection';
import ReviewSection from '@/components/customer/sections/ReviewSection';
import { prisma } from '@/lib/db';
import type { MenuItem } from '@/types';

// The featured strip reads the live menu, so don't prerender this at build time.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const featured = await prisma.menuItem.findMany({
    where: { available: true },
    orderBy: { createdAt: 'desc' },
    take: 6
  });

  return (
    <SiteShell>
      <HeroSection />
      <MenuSection items={featured as unknown as MenuItem[]} />
      <AboutSection />
      <IngredientsSection />
      <LocationSection />
      <ReviewSection />
    </SiteShell>
  );
}
