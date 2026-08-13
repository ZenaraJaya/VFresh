'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMYR } from '@/lib/pricing';
import { readImageFileAsJpeg } from '@/lib/read-image-file';
import RequiredMark from '@/components/shared/ui/RequiredMark';

type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badges: string[];
  available: boolean;
  dailyPackQty: number | null;
  remainingQty: number | null;
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
  image: '',
  badges: [] as string[],
  available: true,
  dailyPackQty: null as number | null,
  remainingQty: null as number | null,
};

export default function VendorMenuManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/menu');
      const data = await res.json();
      setItems(
        Array.isArray(data)
          ? data.map((item: Item) => ({
              ...item,
              dailyPackQty: item.dailyPackQty ?? null,
              remainingQty: item.remainingQty ?? null,
            }))
          : []
      );
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.name} ${item.description} ${item.category}`
        .toLowerCase()
        .includes(needle)
    );
  }, [items, q]);

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
      dailyPackQty: item.dailyPackQty,
      remainingQty: item.remainingQty,
    });
    setOpen(true);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await readImageFileAsJpeg(file, 900, 0.84);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not use that image');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image.trim()) {
      toast.error('Add a photo so customers can see the dish');
      return;
    }
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
      toast.success(editing ? 'Dish updated' : 'Dish is live');
      setOpen(false);
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleLive = async (item: Item) => {
    setToggling(item.id);
    try {
      const res = await fetch(`/api/vendor/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available }),
      });
      if (!res.ok) throw new Error('fail');
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, available: !item.available } : i
        )
      );
      toast.success(item.available ? 'Hidden from customers' : 'Now on sale');
    } catch {
      toast.error('Could not update');
    } finally {
      setToggling(null);
    }
  };

  const saveRemaining = async (item: Item, remainingQty: number | null) => {
    try {
      const res = await fetch(`/api/vendor/menu/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remainingQty }),
      });
      if (!res.ok) throw new Error('fail');
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, remainingQty } : i))
      );
    } catch {
      toast.error('Could not update leftover packs');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this dish?')) return;
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
            Sell
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Your dishes
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            What customers see and can add to cart. Set today’s packs when you
            open — leftover goes down when the customer taps Receive.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add a dish
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find a dish…"
          className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      {loading ? (
        <div className="flex justify-center rounded-3xl border border-neutral-200 bg-white py-20 dark:border-neutral-800 dark:bg-neutral-900">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-lg font-semibold">No dishes yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
            Add a photo, name, and price. Customers can order as soon as you
            save and the store is open.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Add your first dish
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">No dishes match that search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="relative aspect-[16/10] bg-neutral-100 dark:bg-neutral-800">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className={`h-full w-full object-cover ${
                      item.available ? '' : 'opacity-60 grayscale'
                    }`}
                  />
                ) : null}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    item.available
                      ? 'bg-emerald-500 text-white'
                      : 'bg-neutral-800 text-white'
                  }`}
                >
                  {item.available ? 'On sale' : 'Hidden'}
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold leading-tight">{item.name}</h2>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {item.category}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-emerald-600">
                    {formatMYR(item.price)}
                  </p>
                </div>
                <p className="line-clamp-2 text-sm text-neutral-500">
                  {item.description}
                </p>
                <div className="flex items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-neutral-950">
                  <span className="text-xs font-medium text-neutral-500">
                    In kitchen
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-sm hover:bg-white dark:hover:bg-neutral-800"
                      onClick={() =>
                        saveRemaining(
                          item,
                          Math.max(0, (item.remainingQty ?? 0) - 1)
                        )
                      }
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={item.remainingQty ?? ''}
                      placeholder="∞"
                      onChange={(e) => {
                        const v =
                          e.target.value === ''
                            ? null
                            : Math.max(0, Number(e.target.value));
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, remainingQty: v } : i
                          )
                        );
                      }}
                      onBlur={() => saveRemaining(item, item.remainingQty)}
                      className="w-16 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-center text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    />
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-sm hover:bg-white dark:hover:bg-neutral-800"
                      onClick={() =>
                        saveRemaining(item, (item.remainingQty ?? 0) + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={toggling === item.id}
                    onClick={() => toggleLive(item)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    {item.available ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {item.available ? 'Hide' : 'Put on sale'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-xl border border-neutral-200 p-2 hover:bg-neutral-50 dark:border-neutral-700"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded-xl border border-neutral-200 p-2 text-red-600 hover:bg-red-50 dark:border-neutral-700"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
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
                Dish
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {editing ? 'Edit dish' : 'New dish'}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Photo and price are what sell it on the customer page.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Photo
                <RequiredMark />
              </label>
              <p className="text-xs text-neutral-500">
                Upload a photo from your phone or computer.
              </p>
              {form.image ? (
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                </div>
              ) : (
                <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-emerald-500 dark:border-neutral-700">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <span className="mt-1 text-xs">Upload photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={onPickImage}
                  />
                </label>
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700">
                  {form.image ? 'Change photo' : 'Choose file'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={onPickImage}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Name
                <RequiredMark />
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Avocado sourdough toast"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Short description
                <RequiredMark />
              </label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What is in it?"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Price (RM)
                  <RequiredMark />
                </label>
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
                <label className="text-sm font-medium">
                  Category
                  <RequiredMark />
                </label>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Today’s packs</label>
                <input
                  type="number"
                  min="0"
                  value={form.dailyPackQty ?? ''}
                  onChange={(e) => {
                    const dailyPackQty =
                      e.target.value === '' ? null : Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      dailyPackQty,
                      remainingQty:
                        dailyPackQty == null ? f.remainingQty : dailyPackQty,
                    }));
                  }}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">In kitchen</label>
                <input
                  type="number"
                  min="0"
                  value={form.remainingQty ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      remainingQty:
                        e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="No limit"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-neutral-500">
              Optional. Customers cannot add more than leftover. Receive deducts
              leftover automatically.
            </p>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm dark:border-neutral-700">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) =>
                  setForm((f) => ({ ...f, available: e.target.checked }))
                }
              />
              Show on customer menu now
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
                {editing ? 'Save changes' : 'Put on sale'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
