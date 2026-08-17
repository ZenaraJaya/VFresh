'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import MenuSection from '@/components/customer/sections/MenuSection';
import VendorsSection from '@/components/customer/sections/VendorsSection';
import MenuCard from '@/components/customer/menu/MenuCard';
import VendorCard from '@/components/customer/vendors/VendorCard';
import {
  sortMenuOpenFirst,
  sortVendorsOpenFirst,
} from '@/lib/vendor-availability';
import type { MenuItem, VendorPublic } from '@/types';

function matchesFood(item: MenuItem, term: string) {
  const hay = [
    item.name,
    item.description,
    item.category,
    item.vendor?.businessName ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(term);
}

function matchesVendor(vendor: VendorPublic, term: string) {
  const hay = [vendor.businessName, vendor.description ?? '', vendor.address ?? '']
    .join(' ')
    .toLowerCase();
  return hay.includes(term);
}

export default function HomeCatalog({
  items,
  vendors,
}: {
  items: MenuItem[];
  vendors: VendorPublic[];
}) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const displayQuery = q.trim();

  const featured = useMemo(() => {
    const bestsellers = items.filter((i) => i.badges.includes('BESTSELLER'));
    const rest = items.filter((i) => !i.badges.includes('BESTSELLER'));
    return [...bestsellers, ...rest].slice(0, 6);
  }, [items]);

  const vendorPreview = useMemo(
    () => sortVendorsOpenFirst(vendors).slice(0, 6),
    [vendors]
  );

  const foodResults = useMemo(
    () =>
      term
        ? sortMenuOpenFirst(items.filter((item) => matchesFood(item, term)))
        : [],
    [items, term]
  );

  const vendorResults = useMemo(
    () =>
      term
        ? sortVendorsOpenFirst(vendors.filter((v) => matchesVendor(v, term)))
        : [],
    [vendors, term]
  );

  const total = foodResults.length + vendorResults.length;

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-8">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative mx-auto max-w-2xl"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search food or vendor…"
            className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 pl-12 pr-12 text-base outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900"
            aria-label="Search food or vendor"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </form>
      </section>

      {term ? (
        <div className="mx-auto max-w-6xl space-y-14 px-4 pb-16 pt-8">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Search
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">
              Results for &ldquo;{displayQuery}&rdquo;
            </h2>
            <p className="mt-2 text-neutral-500">
              {total === 0
                ? 'Nothing matched. Try another word, or clear the search.'
                : `${foodResults.length} ${foodResults.length === 1 ? 'dish' : 'dishes'} · ${vendorResults.length} ${vendorResults.length === 1 ? 'kitchen' : 'kitchens'}`}
            </p>
          </div>

          <section id="menu" className="scroll-mt-20">
            <div className="mb-6 flex items-end justify-between gap-3">
              <h3 className="text-2xl font-bold tracking-tight">Dishes</h3>
              <span className="text-sm text-neutral-500">
                {foodResults.length}
              </span>
            </div>
            {foodResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500 dark:border-neutral-700">
                No dishes matched this search.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {foodResults.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          <section id="vendors" className="scroll-mt-20">
            <div className="mb-6 flex items-end justify-between gap-3">
              <h3 className="text-2xl font-bold tracking-tight">Kitchens</h3>
              <span className="text-sm text-neutral-500">
                {vendorResults.length}
              </span>
            </div>
            {vendorResults.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500 dark:border-neutral-700">
                No kitchens matched this search.
              </div>
            ) : (
              <div className="space-y-3">
                {vendorResults.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} layout="row" />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <>
          <MenuSection items={featured} />
          <VendorsSection vendors={vendorPreview} />
        </>
      )}
    </>
  );
}
