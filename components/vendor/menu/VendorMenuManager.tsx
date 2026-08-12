'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';

type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badges: string[];
  available: boolean;
};

const CATEGORIES = [
  'SMOOTHIES & DRINKS',
  'BOWLS',
  'WRAPS',
  'SALADS',
  'SNACKS',
  'BREAKFAST',
];

const emptyForm = {
  name: '',
  description: '',
  price: 15,
  category: CATEGORIES[0],
  image:
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  badges: [] as string[],
  available: true,
};

export default function VendorMenuManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/menu');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      badges: item.badges,
      available: item.available,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/vendor/menu/${editing.id}`
        : '/api/vendor/menu';
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Save failed');
        return;
      }
      toast.success(editing ? 'Item updated' : 'Item added');
      setOpen(false);
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    const res = await fetch(`/api/vendor/menu/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Delete failed');
      return;
    }
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Catalogue
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Menu
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Dishes shown on your public VFresh storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center rounded-3xl border border-neutral-200 bg-white py-20 dark:border-neutral-800 dark:bg-neutral-900">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white py-16 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="font-medium text-neutral-700 dark:text-neutral-200">
            No menu items yet
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Add your first dish to appear on the customer site.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 p-4 transition hover:bg-neutral-50/80 dark:hover:bg-neutral-950/50"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-neutral-200 dark:ring-neutral-700">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-900 dark:text-white">
                          {item.name}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            item.available
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {item.available ? 'Live' : 'Hidden'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {formatMYR(item.price)}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {item.category}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-xl border border-neutral-200 p-2 hover:bg-white dark:border-neutral-700 dark:hover:bg-neutral-800"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="rounded-xl border border-neutral-200 p-2 text-red-600 hover:bg-red-50 dark:border-neutral-700 dark:hover:bg-red-950"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Menu item
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {editing ? 'Edit item' : 'New item'}
              </h2>
            </div>
            {(
              [
                ['name', 'Name', 'text'],
                ['description', 'Description', 'text'],
                ['image', 'Image URL', 'url'],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium">{label}</label>
                {key === 'description' ? (
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                ) : (
                  <input
                    type={type}
                    required
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                  />
                )}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Price (MYR)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm dark:border-neutral-700">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) =>
                  setForm((f) => ({ ...f, available: e.target.checked }))
                }
              />
              Available on customer menu
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
