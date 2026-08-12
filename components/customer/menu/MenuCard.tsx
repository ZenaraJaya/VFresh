'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '@/components/shared/ui/Badge';
import { useCart } from '@/context/CartContext';
import { formatMYR } from '@/lib/pricing';
import {
  isVendorAcceptingOrders,
  vendorClosedLabel,
} from '@/lib/vendor-availability';
import type { MenuItem } from '@/types';

export default function MenuCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const accepting = item.vendor
    ? isVendorAcceptingOrders({
        ...item.vendor,
        isOpen: item.vendor.isOpen ?? true,
        status: 'APPROVED',
      })
    : true;
  const closedLabel = item.vendor
    ? vendorClosedLabel({
        ...item.vendor,
        isOpen: item.vendor.isOpen ?? true,
      })
    : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!accepting) {
      toast.error('This vendor is temporarily closed');
      return;
    }
    addItem(item, 1);
    toast.success(`${item.name} added to cart`);
  };

  return (
    <Link
      href={`/menu/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="relative h-44 bg-neutral-100 dark:bg-neutral-800">
        {item.image && (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className={`object-cover transition duration-300 group-hover:scale-105 ${
              !accepting ? 'opacity-70 grayscale' : ''
            }`}
          />
        )}
        {!accepting && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Closed
          </span>
        )}
        <button
          onClick={handleAdd}
          disabled={!accepting}
          aria-label={`Add ${item.name} to cart`}
          className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition ${
            accepting
              ? 'bg-emerald-500 hover:bg-emerald-600'
              : 'cursor-not-allowed bg-neutral-300'
          }`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{item.name}</h3>
          <span className="shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
            {formatMYR(item.price)}
          </span>
        </div>

        <p className="mb-2 line-clamp-2 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
          {item.description}
        </p>

        {item.vendor && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 dark:border-neutral-700 dark:bg-neutral-800/80">
            <Store className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" />
            <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {item.vendor.businessName}
            </p>
          </div>
        )}
        {closedLabel && (
          <p className="mb-3 text-xs font-medium text-amber-700">{closedLabel}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {item.badges.slice(0, 3).map((badge) => (
            <Badge key={badge} text={badge} />
          ))}
        </div>
      </div>
    </Link>
  );
}
