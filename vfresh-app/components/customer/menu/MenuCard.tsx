'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '@/components/shared/ui/Badge';
import { useCart } from '@/context/CartContext';
import { formatMYR } from '@/lib/pricing';
import type { MenuItem } from '@/types';

export default function MenuCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    // The whole card is a link to the detail page — don't navigate on add.
    e.preventDefault();
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
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        <button
          onClick={handleAdd}
          aria-label={`Add ${item.name} to cart`}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
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

        <p className="mb-3 line-clamp-2 flex-1 text-sm text-neutral-600 dark:text-neutral-400">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {item.badges.slice(0, 3).map((badge) => (
            <Badge key={badge} text={badge} />
          ))}
        </div>
      </div>
    </Link>
  );
}
