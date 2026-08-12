import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import VendorSidebar from '@/components/vendor/layout/VendorSidebar';
import VendorHeader from '@/components/vendor/layout/VendorHeader';

export const metadata = {
  title: 'VFresh Vendor',
};

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    session.user.role !== 'VENDOR' ||
    session.user.vendorStatus !== 'APPROVED'
  ) {
    return <div className="flex min-h-screen flex-1 flex-col">{children}</div>;
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.user.id },
  });

  if (!vendor) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-1 bg-[#f6f7f5] dark:bg-neutral-950">
      <VendorSidebar
        businessName={vendor.businessName}
        slug={vendor.slug}
        status={vendor.status}
        logo={vendor.logo}
        hours={{
          isOpen: vendor.isOpen,
          followSchedule: vendor.followSchedule,
          scheduleMode: vendor.scheduleMode,
          closesAt: vendor.closesAt,
          closedUntil: vendor.closedUntil,
          openTime: vendor.openTime,
          closeTime: vendor.closeTime,
          weeklyHours: vendor.weeklyHours,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <VendorHeader
          businessName={vendor.businessName}
          email={vendor.email}
          slug={vendor.slug}
        />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
