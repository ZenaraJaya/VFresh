import Link from 'next/link';
import { Store } from 'lucide-react';
import type { VendorPublic } from '@/types';
import {
  isVendorAcceptingOrders,
  vendorClosedLabel,
} from '@/lib/vendor-availability';

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
            Kitchens delivering on VFresh today.
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
          {vendors.map((v) => {
            const accepting = isVendorAcceptingOrders({
              ...v,
              isOpen: v.isOpen ?? true,
              status: 'APPROVED',
            });
            const closedLabel = vendorClosedLabel({
              ...v,
              isOpen: v.isOpen ?? true,
            });

            return (
              <Link
                key={v.id}
                href={`/vendors/${v.slug}`}
                className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Store className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {v.businessName}
                    </h3>
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
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                    {v.description || 'Healthy meals for the office.'}
                  </p>
                  <p className="mt-2 text-xs text-emerald-600">
                    {v._count?.menuItems ?? 0} menu items
                  </p>
                  {closedLabel && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      {closedLabel}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
