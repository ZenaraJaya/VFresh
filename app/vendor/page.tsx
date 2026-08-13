import Link from 'next/link';
import { ExternalLink, Plus } from 'lucide-react';
import { requireVendor } from '@/lib/auth-guard';
import { prisma } from '@/lib/db';
import VendorDashboardLive from '@/components/vendor/home/VendorDashboardLive';

export const dynamic = 'force-dynamic';

export default async function VendorDashboardPage() {
  const session = await requireVendor();
  const vendor = await prisma.vendor.findUnique({
    where: { id: session.user.id },
  });
  if (!vendor) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            {vendor.businessName}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
            Sell today
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Orders and store status update live — no refresh needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/vendor/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Add a dish
          </Link>
          <Link
            href={`/vendors/${vendor.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium hover:border-emerald-300 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <ExternalLink className="h-4 w-4" />
            View store
          </Link>
        </div>
      </div>

      <VendorDashboardLive />
    </div>
  );
}
