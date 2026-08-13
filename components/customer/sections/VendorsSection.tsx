import Link from 'next/link';
import type { VendorPublic } from '@/types';
import VendorCard from '@/components/customer/vendors/VendorCard';

export default function VendorsSection({
  vendors,
}: {
  vendors: VendorPublic[];
}) {
  return (
    <section id="vendors" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Vendors
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            See where each kitchen is, when they are open, and what they cook.
          </p>
        </div>
        <Link
          href="/vendors"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          See all vendors
        </Link>
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center text-neutral-500 dark:border-neutral-700">
          No approved vendors yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </section>
  );
}
