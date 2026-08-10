'use client';

import { Search } from 'lucide-react';

interface MenuFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
}

export default function MenuFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories
}: MenuFiltersProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        />
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
      >
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
