'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type VendorRow = {
  id: string;
  email: string;
  businessName: string;
  slug: string;
  phone: string | null;
  address?: string | null;
  premisesType?: string | null;
  status: string;
  warningCount?: number;
  createdAt: string;
  _count: { menuItems: number };
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-neutral-200 text-neutral-700',
};

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendors');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to load vendors');
        setVendors([]);
        return;
      }
      setVendors(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/vendors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Update failed');
      return;
    }
    if (status === 'APPROVED' && data.tempPassword) {
      if (data.emailSent) {
        toast.success('Approved — temporary password emailed');
      } else {
        toast.success(
          `Approved. Email not sent — temp password: ${data.tempPassword}`,
          { duration: 12000 }
        );
      }
    } else {
      toast.success(`Marked ${status.toLowerCase()}`);
    }
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
        <p className="text-sm text-neutral-500">
          Open a vendor to review its menu, warn twice, then suspend with a
          reason if there is no improvement.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr
                  key={v.id}
                  tabIndex={0}
                  role="link"
                  onClick={() => router.push(`/admin/vendors/${v.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/admin/vendors/${v.id}`);
                    }
                  }}
                  className="cursor-pointer border-b border-neutral-100 text-neutral-900 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{v.businessName}</p>
                    <p className="text-xs text-neutral-500">
                      /{v.slug}
                      {v.premisesType ? ` · ${v.premisesType}` : ''}
                    </p>
                    {v.address && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-400">
                        {v.address}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{v.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[v.status] ?? ''}`}
                    >
                      {v.status}
                    </span>
                    {typeof v.warningCount === 'number' && v.warningCount > 0 ? (
                      <p className="mt-1 text-[11px] text-amber-700">
                        {v.warningCount}/2 warnings
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{v._count.menuItems}</td>
                  <td className="px-4 py-3">
                    <div
                      className="flex flex-wrap gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {v.status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => setStatus(v.id, 'APPROVED')}
                          className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                        >
                          Approve
                        </button>
                      )}
                      {v.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => setStatus(v.id, 'REJECTED')}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-white hover:text-red-800 dark:border-red-900 dark:text-red-400"
                        >
                          Reject
                        </button>
                      )}
                      {v.status === 'APPROVED' && (
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
                        >
                          Review menu
                        </Link>
                      )}
                      {v.status === 'PENDING' && (
                        <Link
                          href={`/admin/vendors/${v.id}`}
                          className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
                        >
                          Open
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
