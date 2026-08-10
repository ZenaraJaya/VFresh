'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import MenuCard from '@/components/customer/menu/MenuCard';
import type { MenuItem } from '@/types';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => ['ALL', ...new Set(items.map((i) => i.category))],
    [items]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === 'ALL' || item.category === category;
      const matchesSearch =
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, category]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Menu</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Everything is made the morning it ships. Order by 10am for same-day
          delivery.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the menu..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              category === cat
                ? 'bg-emerald-500 text-white'
                : 'border border-neutral-200 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-16 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-red-700 dark:text-red-400">
            Couldn&apos;t load the menu. Please refresh to try again.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
          <p className="text-neutral-500 dark:text-neutral-400">
            Nothing matches that search.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
