'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function ProfileForm({
  name,
  phone,
}: {
  name: string;
  phone: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [fullName, setFullName] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, phone: phoneValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save');
      await update({ name: fullName.trim() });
      toast.success('Profile saved');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="profile-name">
          Name
        </label>
        <input
          id="profile-name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="profile-phone">
          Phone
        </label>
        <input
          id="profile-phone"
          value={phoneValue}
          onChange={(e) => setPhoneValue(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
