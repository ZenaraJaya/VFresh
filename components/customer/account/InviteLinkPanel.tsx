'use client';

import { useEffect, useState } from 'react';
import { Copy, Link2, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InviteLinkPanel({
  companyName,
}: {
  companyName: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/account/invites');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not load invite');
      setToken(data.invite?.token ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load invite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/account/invites', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create link');
      setToken(data.token);
      toast.success(token ? 'New staff link created' : 'Staff link ready');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create link');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/account/invites', { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not revoke link');
      setToken(null);
      toast.success('Staff link revoked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not revoke');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!token) return;
    const url = `${origin || window.location.origin}/register?invite=${encodeURIComponent(token)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  if (loading) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading staff link…
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex items-start gap-2">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            Staff cover link
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Share this with a teammate so they can place orders and pay for{' '}
            {companyName} while you are on leave.
          </p>
        </div>
      </div>

      {token ? (
        <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
          {origin
            ? `${origin}/register?invite=${token}`
            : `/register?invite=${token}`}
        </p>
      ) : (
        <p className="text-sm text-neutral-500">No active link yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {token ? (
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void create()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {token ? 'New link' : 'Create link'}
        </button>
        {token ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void revoke()}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Revoke
          </button>
        ) : null}
      </div>
    </div>
  );
}
