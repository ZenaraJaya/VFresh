'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import { isValidPassword } from '@/lib/password-rules';

export default function VendorAccountForm() {
  const [email, setEmail] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/vendor/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEmail(data.email ?? '');
      })
      .catch(() => toast.error('Failed to load account'));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (!isValidPassword(newPassword)) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/password', {
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
      setSaving(false);
    }
  };

  if (email === null) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Login email and password. Kitchen details are in Store.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            readOnly
            value={email}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400"
          />
        </div>

        <form onSubmit={save} className="space-y-4 border-t border-neutral-100 pt-5 dark:border-neutral-800">
          <PasswordInput
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
          />
          <PasswordInput
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required
            showRule
          />
          <PasswordInput
            id="confirm-password"
            label="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>

      <div className="flex justify-end border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:border-red-400 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
