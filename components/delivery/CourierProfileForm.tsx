'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import PhoneInput from '@/components/shared/ui/PhoneInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import { isValidPassword } from '@/lib/password-rules';

const FIELD =
  'w-full rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950';

export default function CourierProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [fullName, setFullName] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/courier/profile', {
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

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (!isValidPassword(newPassword)) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/courier/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update password');
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Kitchen and customers see your name after you claim a run.
        </p>
      </div>

      <form
        onSubmit={(e) => void saveProfile(e)}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="courier-email">
            Email
          </label>
          <input
            id="courier-email"
            type="email"
            readOnly
            value={email}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="courier-name">
            Name
            <RequiredMark />
          </label>
          <input
            id="courier-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={FIELD}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="courier-phone">
            Phone
          </label>
          <PhoneInput
            id="courier-phone"
            value={phoneValue}
            onChange={setPhoneValue}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save profile
        </button>
      </form>

      <form
        onSubmit={(e) => void savePassword(e)}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="text-sm font-semibold">Password</h2>
        <PasswordInput
          id="courier-current-password"
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          id="courier-new-password"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          required
          showRule
        />
        <PasswordInput
          id="courier-confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
        />
        <button
          type="submit"
          disabled={savingPassword}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
          Update password
        </button>
      </form>

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:border-red-400 hover:bg-white hover:text-red-700 dark:border-red-800"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
