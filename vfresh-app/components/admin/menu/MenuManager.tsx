'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import MenuForm from '@/components/admin/menu/MenuForm';
import MenuGrid from '@/components/admin/menu/MenuGrid';
import MenuFilters from '@/components/admin/menu/MenuFilters';
import toast from 'react-hot-toast';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badges: string[];
  available: boolean;
}

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/admin/menu');
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      // A failed request can still parse as JSON (an error object) — only
      // arrays are safe to render as a list.
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Menu item deleted');
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleSave = async (data: Partial<MenuItem>) => {
    try {
      const url = editingItem
        ? `/api/admin/menu/${editingItem.id}`
        : '/api/admin/menu';

      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(editingItem ? 'Menu item updated' : 'Menu item created');
      setIsFormOpen(false);
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to save menu item');
    }
  };

  const categories = ['ALL', ...new Set(menuItems.map((item) => item.category))];

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Menu Management
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Add, edit, and manage your menu items
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      {/* Filters */}
      <MenuFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categories={categories}
      />

      {/* Menu Grid */}
      <MenuGrid
        items={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <MenuForm
          item={editingItem}
          onSave={handleSave}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
