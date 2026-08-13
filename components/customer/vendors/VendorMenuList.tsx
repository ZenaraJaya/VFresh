'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import MenuCard from '@/components/customer/menu/MenuCard';
import type { MenuItem } from '@/types';

export default function VendorMenuList({ items }: { items: MenuItem[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => {
      const hay = `${item.name} ${item.description} ${item.category} ${item.badges.join(' ')}`;
      return hay.toLowerCase().includes(needle);
    });
  }, [items, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Menu</h2>
          <p className="text-sm text-neutral-500">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative w-full sm:max-w-sm"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this menu…"
            aria-label="Search this vendor menu"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          {q.trim()
            ? 'No dishes match that search.'
            : 'No menu items yet.'}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} hideVendor />
          ))}
        </div>
      )}
    </div>
  );
}
