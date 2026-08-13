'use client';

import Image from 'next/image';
import { Edit, Trash2 } from 'lucide-react';
import Badge from '@/components/shared/ui/Badge';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badges: string[];
  available: boolean;
}

interface MenuGridProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

export default function MenuGrid({ items, onEdit, onDelete }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 dark:text-neutral-400">No menu items found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div
          key={item.id}
          className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-lg transition ${
            !item.available ? 'opacity-60' : ''
          }`}
        >
          <div className="relative h-40">
            <Image
              src={item.image || 'https://via.placeholder.com/400x200'}
              alt={item.name}
              fill
              className="object-cover"
            />
            {!item.available && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                  Unavailable
                </span>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => onEdit(item)}
                className="p-2 bg-white dark:bg-neutral-800 rounded-lg hover:bg-emerald-500 hover:text-white transition"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 bg-white dark:bg-neutral-800 rounded-lg hover:bg-red-500 hover:text-white transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  {item.name}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {item.category}
                </p>
              </div>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                RM {item.price.toFixed(2)}
              </span>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
              {item.description}
            </p>

            <div className="flex flex-wrap gap-1">
              {item.badges.slice(0, 3).map((badge) => (
                <Badge key={badge} text={badge} />
              ))}
              {item.badges.length > 3 && (
                <span className="text-xs text-neutral-500">
                  +{item.badges.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}