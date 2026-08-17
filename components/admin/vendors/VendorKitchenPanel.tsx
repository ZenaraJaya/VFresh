'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import SafeImage from '@/components/shared/ui/SafeImage';
import { formatMYR } from '@/lib/pricing';

type MenuRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  reviewStatus: 'LIVE' | 'REJECTED';
  rejectReason: string | null;
};

type VendorDetail = {
  id: string;
  email: string;
  businessName: string;
  slug: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  status: string;
  warningCount: number;
  lastWarningReason: string | null;
  warningHistory: { at: string; reason: string }[] | null;
  suspendReason: string | null;
  menuItems: MenuRow[];
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-neutral-200 text-neutral-700',
};

export default function VendorKitchenPanel() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reasonOpen, setReasonOpen] = useState<
    null | { kind: 'warn' | 'suspend' | 'reject'; itemId?: string }
  >(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVendor(data);
    } catch {
      toast.error('Could not load vendor');
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitReason = async () => {
    if (!vendor || !reasonOpen) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Give a reason');
      return;
    }
    setBusy(true);
    try {
      if (reasonOpen.kind === 'reject' && reasonOpen.itemId) {
        const res = await fetch(`/api/admin/menu/${reasonOpen.itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', reason: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success('Dish removed from the storefront');
      } else {
        const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: reasonOpen.kind, reason: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(
          reasonOpen.kind === 'warn'
            ? `Warning ${data.warningCount} of 2 sent`
            : 'Vendor suspended'
        );
      }
      setReasonOpen(null);
      setReason('');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: string) => {
    if (!vendor) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Marked ${status.toLowerCase()}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const restoreDish = async (itemId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Dish restored');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not restore');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-neutral-500">Vendor not found.</p>
        <Link
          href="/admin/vendors"
          className="inline-flex min-h-11 items-center rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium dark:border-neutral-700"
        >
          Back
        </Link>
      </div>
    );
  }

  const history = Array.isArray(vendor.warningHistory)
    ? vendor.warningHistory
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/vendors"
        className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All vendors
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{vendor.businessName}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[vendor.status] ?? ''}`}
            >
              {vendor.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {vendor.email}
            {vendor.phone ? ` · ${vendor.phone}` : ''}
          </p>
          {vendor.address ? (
            <p className="text-sm text-neutral-500">{vendor.address}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {vendor.status === 'PENDING' ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStatus('APPROVED')}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStatus('REJECTED')}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
              >
                Reject signup
              </button>
            </>
          ) : null}
          {vendor.status === 'APPROVED' ? (
            <>
              <button
                type="button"
                disabled={busy || vendor.warningCount >= 2}
                onClick={() => {
                  setReason('');
                  setReasonOpen({ kind: 'warn' });
                }}
                className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 disabled:opacity-50"
              >
                Warn ({vendor.warningCount}/2)
              </button>
              <button
                type="button"
                disabled={busy || vendor.warningCount < 2}
                onClick={() => {
                  setReason('');
                  setReasonOpen({ kind: 'suspend' });
                }}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 transition hover:bg-white hover:text-red-700 disabled:opacity-50"
              >
                Suspend
              </button>
            </>
          ) : null}
          {vendor.status === 'SUSPENDED' ? (
            <p className="max-w-sm text-sm text-neutral-600">
              Suspended. They cannot register again. If they email you and you
              accept the appeal, approve the same account.
            </p>
          ) : null}
        </div>
      </div>

      {vendor.description ? (
        <p className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          {vendor.description}
        </p>
      ) : null}

      {vendor.suspendReason ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Suspended: {vendor.suspendReason}
        </p>
      ) : null}

      {history.length > 0 ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-semibold">Warnings</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {history.map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                <span className="font-medium">#{index + 1}</span>{' '}
                {new Date(entry.at).toLocaleString()} — {entry.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Menu</h2>
          <p className="text-sm text-neutral-500">
            Reject inappropriate dishes with a reason. The vendor is emailed
            and the item leaves the storefront.
          </p>
        </div>
        {vendor.menuItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 px-5 py-10 text-center text-sm text-neutral-500">
            No dishes yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {vendor.menuItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="h-36 overflow-hidden bg-neutral-100">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-xs text-neutral-500">{item.category}</p>
                    </div>
                    <span className="text-sm font-bold">
                      {formatMYR(item.price)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {item.description}
                  </p>
                  {item.reviewStatus === 'REJECTED' ? (
                    <p className="text-xs text-red-700">
                      Rejected: {item.rejectReason || 'Removed from storefront'}
                    </p>
                  ) : null}
                  {item.reviewStatus === 'REJECTED' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => restoreDish(item.id)}
                      className="w-full rounded-xl border border-neutral-200 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-white dark:hover:text-neutral-900"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setReason('');
                        setReasonOpen({ kind: 'reject', itemId: item.id });
                      }}
                      className="w-full rounded-xl border border-red-200 py-2 text-sm font-medium text-red-800 transition hover:bg-white hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:bg-white dark:hover:text-red-700"
                    >
                      Reject dish
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {reasonOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 dark:bg-neutral-900">
            <h3 className="font-semibold">
              {reasonOpen.kind === 'warn'
                ? `Warning ${(vendor.warningCount ?? 0) + 1} of 2`
                : reasonOpen.kind === 'suspend'
                  ? 'Suspend vendor'
                  : 'Reject dish'}
            </h3>
            <p className="text-sm text-neutral-500">
              {reasonOpen.kind === 'suspend'
                ? 'Two warnings were already sent. Explain why there was no improvement. They cannot register again and must email you to appeal.'
                : 'This reason is emailed to the vendor.'}
            </p>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setReasonOpen(null)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-white dark:hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitReason()}
                className={
                  reasonOpen.kind === 'warn'
                    ? 'rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600'
                    : 'rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-white hover:text-red-700 dark:border-red-500 dark:text-red-400 dark:hover:bg-white dark:hover:text-red-700'
                }
              >
                {busy ? 'Sending…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
