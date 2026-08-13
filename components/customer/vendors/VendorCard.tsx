import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';
import type { VendorPublic } from '@/types';
import {
  formatVendorSchedule,
  isVendorAcceptingOrders,
  vendorClosedLabel,
} from '@/lib/vendor-availability';
import VendorLogo from './VendorLogo';

export default function VendorCard({ vendor }: { vendor: VendorPublic }) {
  const accepting = isVendorAcceptingOrders({
    ...vendor,
    isOpen: vendor.isOpen ?? true,
    status: 'APPROVED',
  });
  const hours = formatVendorSchedule(vendor);
  const closedLabel = vendorClosedLabel({
    ...vendor,
    isOpen: vendor.isOpen ?? true,
  });

  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative aspect-[16/9] bg-neutral-100 dark:bg-neutral-800">
        {vendor.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vendor.logo}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <VendorLogo src={null} name={vendor.businessName} className="h-16 w-16" />
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            accepting
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {accepting ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          {vendor.businessName}
        </h3>
        {vendor.description && (
          <p className="line-clamp-2 text-sm text-neutral-500">
            {vendor.description}
          </p>
        )}
        {vendor.address && (
          <p className="flex items-start gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{vendor.address}</span>
          </p>
        )}
        {hours && (
          <p className="flex items-start gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{hours}</span>
          </p>
        )}
        {closedLabel && (
          <p className="text-xs font-medium text-amber-700">{closedLabel}</p>
        )}
      </div>
    </Link>
  );
}
