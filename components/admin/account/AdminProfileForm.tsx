'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import ProfileAvatar from '@/components/shared/ui/ProfileAvatar';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import { isValidPassword } from '@/lib/password-rules';

export default function AdminProfileForm() {
  const { data, update } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setName(body.name ?? '');
        setEmail(body.email ?? '');
      })
      .catch(() => toast.error('Could not load profile'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || 'Could not save');
        return;
      }
      await update({ name: body.name });
      toast.success('Profile saved');
    } catch {
      toast.error('Could not save');
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
      const res = await fetch('/api/admin/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || 'Could not update password');
        return;
      }
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch {
      toast.error('Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <ProfileAvatar src={data?.user?.image} name={name} size={56} />
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Your admin identity for reviews and vendor emails.
          </p>
        </div>
      </div>

      <form
        onSubmit={save}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="admin-name">
            Name
            <RequiredMark />
          </label>
          <input
            id="admin-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            readOnly
            value={email || data?.user?.email || ''}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save
        </button>
      </form>

      <form
        onSubmit={(e) => void savePassword(e)}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <h2 className="font-semibold">Password</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your current password, then choose a new one.
          </p>
        </div>
        <PasswordInput
          id="admin-current-password"
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="current-password"
          required
        />
        <PasswordInput
          id="admin-new-password"
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          required
          showRule
        />
        <PasswordInput
          id="admin-confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
        />
        <button
          type="submit"
          disabled={savingPassword}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Update password
        </button>
      </form>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-semibold">Session</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Sign out of the operations desk. You can sign back in from the shared
          login page.
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
