'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import { isValidPassword } from '@/lib/password-rules';

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

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
      const res = await fetch('/api/account/password', {
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

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-4">
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
        className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {saving ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
