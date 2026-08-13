import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MenuCard from '@/components/customer/menu/MenuCard';
import type { MenuItem } from '@/types';

export default function MenuSection({ items }: { items: MenuItem[] }) {
  return (
    <section id="menu" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            This week&apos;s favourites
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Popular picks from our kitchens — each card shows the vendor.
          </p>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          See all items
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
          <p className="text-neutral-500 dark:text-neutral-400">
            No menu items yet. Add some from the admin dashboard.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
