'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Profile = {
  businessName: string;
  description: string;
  phone: string;
  address: string;
  registrationNumber: string | null;
  premisesType: 'HOMEBASED' | 'OTHER';
  slug: string;
};

export default function VendorProfileForm() {
  const [form, setForm] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/vendor/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setForm({
          businessName: data.businessName,
          description: data.description ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          registrationNumber: data.registrationNumber ?? null,
          premisesType: data.premisesType === 'HOMEBASED' ? 'HOMEBASED' : 'OTHER',
          slug: data.slug,
        });
      })
      .catch(() => toast.error('Failed to load profile'));
  }, []);

  if (!form) {
    return (
      <div className="flex justify-center rounded-3xl border border-neutral-200 bg-white py-20 dark:border-neutral-800 dark:bg-neutral-900">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('fail');
      toast.success('Profile saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Store
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Store profile
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            How your kitchen appears to customers on VFresh.
          </p>
        </div>
      </div>

      <form
        onSubmit={save}
        className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
      >
        {(
          [
            ['businessName', 'Business name'],
            ['phone', 'Phone'],
            ['address', 'Address'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-medium">{label}</label>
            <input
              value={form[key]}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, [key]: e.target.value } : f))
              }
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
              required
            />
          </div>
        ))}

        <div className="space-y-1">
          <label className="text-sm font-medium">Short description</label>
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, description: e.target.value } : f))
            }
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Premises type</label>
            <select
              value={form.premisesType}
              onChange={(e) =>
                setForm((f) =>
                  f
                    ? {
                        ...f,
                        premisesType: e.target.value as 'HOMEBASED' | 'OTHER',
                      }
                    : f
                )
              }
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="HOMEBASED">Home-based</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              SSM / ROC (optional)
            </label>
            <input
              value={form.registrationNumber ?? ''}
              onChange={(e) =>
                setForm((f) =>
                  f ? { ...f, registrationNumber: e.target.value || null } : f
                )
              }
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}
