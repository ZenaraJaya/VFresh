import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';
import type { VendorPublic } from '@/types';
import {
  formatVendorSchedule,
  isVendorAcceptingOrders,
  vendorClosedLabel,
  vendorOpenBadge,
} from '@/lib/vendor-availability';
import VendorLogo from './VendorLogo';

export default function VendorCard({
  vendor,
  layout = 'card',
}: {
  vendor: VendorPublic;
  layout?: 'card' | 'row';
}) {
  const accepting = isVendorAcceptingOrders({
    ...vendor,
    isOpen: vendor.isOpen ?? true,
    status: 'APPROVED',
  });
  const badge = vendorOpenBadge({
    ...vendor,
    isOpen: vendor.isOpen ?? true,
    status: 'APPROVED',
  });
  const hours = formatVendorSchedule(vendor);
  const closedLabel = vendorClosedLabel({
    ...vendor,
    isOpen: vendor.isOpen ?? true,
  });

  const statusClass = accepting
    ? 'bg-emerald-500 text-white'
    : 'bg-amber-500 text-white';

  if (layout === 'row') {
    return (
      <Link
        href={`/vendors/${vendor.slug}`}
        className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
          {vendor.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vendor.logo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <VendorLogo
                src={null}
                name={vendor.businessName}
                className="h-12 w-12"
              />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              {vendor.businessName}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass}`}
            >
              {badge}
            </span>
          </div>
          {vendor.description ? (
            <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
              {vendor.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {vendor.address ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="line-clamp-1">{vendor.address}</span>
              </p>
            ) : null}
            {hours ? (
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>{hours}</span>
              </p>
            ) : null}
          </div>
          {closedLabel ? (
            <p className="mt-1 text-xs font-medium text-amber-700">
              {closedLabel}
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

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
          {badge}
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
