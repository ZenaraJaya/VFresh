'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type Row = {
  id: string;
  weekdayLabel: string;
  vendorName: string;
  deliveryLocation: string;
  deliveryTime: string | null;
  employeeName: string;
};

export default function StandingOrdersPanel() {
  const [email, setEmail] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState<string | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/standing-orders?email=${encodeURIComponent(trimmed)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('fail');
      setRows(await res.json());
    } catch {
      toast.error('Could not look up weekly orders');
    } finally {
      setLoading(false);
    }
  };

  const stop = async (id: string) => {
    setStopping(id);
    try {
      const res = await fetch('/api/standing-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email: email.trim() }),
      });
      if (!res.ok) throw new Error('fail');
      setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
      toast.success('Weekly order stopped');
    } catch {
      toast.error('Could not stop this weekly order');
    } finally {
      setStopping(null);
    }
  };

  return (
    <div className="mt-16 rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
      <h2 className="text-lg font-semibold">Weekly orders</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Enter the email you used at checkout to see or stop a repeating order
        (every Wednesday, and so on).
      </p>
      <form onSubmit={lookup} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {loading ? 'Looking…' : 'Find weekly orders'}
        </button>
      </form>
      {rows && rows.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">No active weekly orders.</p>
      )}
      {rows && rows.length > 0 && (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-950"
            >
              <div>
                <p className="text-sm font-medium">
                  Every {row.weekdayLabel} · {row.vendorName}
                </p>
                <p className="text-xs text-neutral-500">
                  {row.employeeName} · {row.deliveryLocation}
                  {row.deliveryTime ? ` · ${row.deliveryTime}` : ''}
                </p>
              </div>
              <button
                type="button"
                disabled={stopping === row.id}
                onClick={() => stop(row.id)}
                className="text-sm font-medium text-amber-800 hover:underline disabled:opacity-60"
              >
                Stop
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
