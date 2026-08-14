'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { FIELD } from '@/components/customer/account/ui';
import JobTitleField from '@/components/customer/account/JobTitleField';
import PhoneInput from '@/components/shared/ui/PhoneInput';

export default function ProfileForm({
  name,
  phone,
  jobTitle,
}: {
  name: string;
  phone: string;
  jobTitle: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [fullName, setFullName] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [roleValue, setRoleValue] = useState(jobTitle);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          phone: phoneValue,
          jobTitle: roleValue.trim(),
        }),
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
          className={FIELD}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="profile-phone">
          Phone
        </label>
        <PhoneInput
          id="profile-phone"
          value={phoneValue}
          onChange={setPhoneValue}
        />
      </div>
      <JobTitleField
        id="profile-job"
        value={roleValue}
        onChange={setRoleValue}
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
