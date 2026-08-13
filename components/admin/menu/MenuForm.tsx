'use client';

import { useState } from 'react';
import { X, Upload, Plus, XCircle } from 'lucide-react';
import Image from 'next/image';
import RequiredMark from '@/components/shared/ui/RequiredMark';

interface MenuItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  badges: string[];
  available: boolean;
}

interface MenuFormProps {
  item: MenuItem | null;
  onSave: (data: Partial<MenuItem>) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'SMOOTHIES & DRINKS',
  'BOWLS',
  'WRAPS',
  'SALADS',
  'SNACKS',
  'BREAKFAST',
  'CATERING'
];

const BADGE_OPTIONS = [
  'BESTSELLER',
  'VEGAN',
  'VEGETARIAN',
  'GLUTEN-FREE',
  'HIGH PROTEIN',
  'LOW CARB',
  'LOW SUGAR',
  'CAFFEINE',
  'SUPERFOOD',
  'ANTIOXIDANTS',
  'OMEGA-3',
  'KETO',
  'PALEO',
  'SPICY'
];

export default function MenuForm({ item, onSave, onClose }: MenuFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || 0,
    category: item?.category || CATEGORIES[0],
    image: item?.image || '',
    badges: item?.badges || [],
    available: item?.available ?? true
  });
  const [newBadge, setNewBadge] = useState('');
  const [imagePreview, setImagePreview] = useState(item?.image || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // For demo, using placeholder image
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    const fakeUpload = async () => {
      return new Promise(resolve => {
        setTimeout(() => {
          const imageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop`;
          resolve(imageUrl);
        }, 1000);
      });
    };

    try {
      const imageUrl = await fakeUpload();
      setFormData({ ...formData, image: imageUrl as string });
      setImagePreview(imageUrl as string);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const addBadge = () => {
    if (newBadge && !formData.badges.includes(newBadge)) {
      setFormData({
        ...formData,
        badges: [...formData.badges, newBadge]
      });
      setNewBadge('');
    }
  };

  const removeBadge = (badge: string) => {
    setFormData({
      ...formData,
      badges: formData.badges.filter(b => b !== badge)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {item ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Image
              <RequiredMark />
            </label>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setFormData({ ...formData, image: '' });
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition">
                  <Upload className="w-8 h-8 text-neutral-400" />
                  <span className="text-xs text-neutral-500 mt-1">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
              {uploading && (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                  <span className="ml-2 text-sm text-neutral-500">Uploading...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Or enter image URL manually:
            </p>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => {
                setFormData({ ...formData, image: e.target.value });
                setImagePreview(e.target.value);
              }}
              className="mt-2 w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Name
                <RequiredMark />
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="e.g., Dark Mocha Latte"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="Describe the item..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Price (RM)
                <RequiredMark />
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
                <RequiredMark />
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Badges */}
          <div>
            <label className="block text-sm font-medium mb-2">Badges</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.badges.map(badge => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
                >
                  {badge}
                  <button
                    type="button"
                    onClick={() => removeBadge(badge)}
                    className="hover:text-red-500"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newBadge}
                onChange={(e) => setNewBadge(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="">Select a badge...</option>
                {BADGE_OPTIONS.filter(b => !formData.badges.includes(b)).map(badge => (
                  <option key={badge} value={badge}>{badge}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addBadge}
                disabled={!newBadge}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium">Available for order</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition"
            >
              {item ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}