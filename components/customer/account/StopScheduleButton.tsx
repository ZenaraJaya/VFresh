'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function StopScheduleButton({ id }: { id: string }) {
  const [saving, setSaving] = useState(false);

  const stop = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/standing-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('fail');
      toast.success('Weekly order stopped');
      window.location.reload();
    } catch {
      toast.error('Could not stop this weekly order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => void stop()}
      className="text-sm font-medium text-amber-800 hover:underline disabled:opacity-60"
    >
      Stop
    </button>
  );
}
