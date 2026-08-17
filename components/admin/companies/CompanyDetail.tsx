'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyStatusLabel } from '@/lib/company';
import { formatMYR } from '@/lib/pricing';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import { isValidPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-rules';

type StaffRow = {
  id: string;
  name: string | null;
  email: string;
  jobTitle: string | null;
  companyRole: string | null;
};

const emptyStaff = {
  name: '',
  email: '',
  password: '',
  jobTitle: '',
  companyRole: 'STAFF' as 'OWNER' | 'STAFF',
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  employeeName: string;
};

type CompanyDetailData = {
  id: string;
  name: string;
  billingEmail: string;
  billingAddress: string | null;
  phone: string | null;
  isActive: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  createdAt: string;
  registeredBy: {
    name: string | null;
    email: string;
    jobTitle: string | null;
  } | null;
  customers: StaffRow[];
  orders: OrderRow[];
  _count: { customers: number; orders: number };
};

function statusClass(status: string, isActive: boolean) {
  if (status === 'PENDING') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
  }
  if (status === 'REJECTED' || !isActive) {
    return 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300';
  }
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
}

export default function CompanyDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [company, setCompany] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);
  const [staffForm, setStaffForm] = useState(emptyStaff);
  const [pendingDelete, setPendingDelete] = useState<StaffRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompany(data);
    } catch {
      toast.error('Could not load company');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = async (body: Record<string, unknown>, ok: string) => {
    if (!company) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const openCreateStaff = () => {
    setEditingStaff(null);
    setStaffForm(emptyStaff);
    setStaffOpen(true);
  };

  const openEditStaff = (person: StaffRow) => {
    setEditingStaff(person);
    setStaffForm({
      name: person.name ?? '',
      email: person.email,
      password: '',
      jobTitle: person.jobTitle ?? '',
      companyRole: person.companyRole === 'OWNER' ? 'OWNER' : 'STAFF',
    });
    setStaffOpen(true);
  };

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setBusy(true);
    try {
      const url = editingStaff
        ? `/api/admin/customers/${editingStaff.id}`
        : `/api/admin/companies/${company.id}/staff`;
      const body: Record<string, string> = {
        name: staffForm.name,
        email: staffForm.email,
        jobTitle: staffForm.jobTitle,
        companyRole: staffForm.companyRole,
      };
      if (staffForm.password) body.password = staffForm.password;
      if (!editingStaff) body.password = staffForm.password;

      const res = await fetch(url, {
        method: editingStaff ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast.success(editingStaff ? 'User updated' : 'User added');
      setStaffOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteStaff = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/customers/${pendingDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success('User deleted');
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
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

  if (!company) {
    return (
      <p className="text-sm text-neutral-500">
        Company not found.{' '}
        <Link href="/admin/companies" className="text-emerald-700 underline">
          Back to companies
        </Link>
      </p>
    );
  }

  const who = company.registeredBy
    ? `Registered by ${company.registeredBy.name || company.registeredBy.email}${
        company.registeredBy.jobTitle ? ` · ${company.registeredBy.jobTitle}` : ''
      }`
    : 'Opened by admin';

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          All companies
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="mt-1 text-sm text-neutral-500">{who}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(company.status, company.isActive)}`}
          >
            {company.status === 'APPROVED' && !company.isActive
              ? 'Inactive'
              : companyStatusLabel(company.status)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {company.status !== 'APPROVED' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ status: 'APPROVED' }, 'Company approved')}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Approve
            </button>
          ) : null}
          {company.status === 'PENDING' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ status: 'REJECTED' }, 'Company rejected')}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-white hover:text-red-800 disabled:opacity-60 dark:border-red-900 dark:text-red-400"
            >
              Reject
            </button>
          ) : null}
          {company.status === 'APPROVED' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void patch(
                  { isActive: !company.isActive },
                  company.isActive ? 'Company deactivated' : 'Company reactivated'
                )
              }
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 transition hover:bg-white hover:text-neutral-900 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-200"
            >
              {company.isActive ? 'Deactivate' : 'Reactivate'}
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Details
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Billing email</dt>
            <dd>{company.billingEmail}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Phone</dt>
            <dd>{company.phone || '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-neutral-500">Billing address</dt>
            <dd>{company.billingAddress || '—'}</dd>
          </div>
          {company.reviewNote ? (
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">Review note</dt>
              <dd>{company.reviewNote}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Users ({company._count.customers})
          </h2>
          <button
            type="button"
            onClick={openCreateStaff}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Add user
          </button>
        </div>
        {company.customers.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No users linked yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
            {company.customers.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {person.name || person.email}
                    <span className="ml-2 font-normal text-neutral-500">
                      {person.email}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    {person.companyRole === 'OWNER'
                      ? 'Owner'
                      : person.jobTitle || 'Staff'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEditStaff(person)}
                    className="rounded-lg p-2 text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                    aria-label="Edit user"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(person)}
                    className="rounded-lg p-2 text-red-600 transition hover:bg-white hover:text-red-700 dark:hover:bg-neutral-800"
                    aria-label="Delete user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent orders ({company._count.orders})
        </h2>
        {company.orders.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">No orders yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
            {company.orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm"
              >
                <span className="font-mono font-medium">{order.orderNumber}</span>
                <span className="text-neutral-500">
                  {order.employeeName} · {order.status} · {formatMYR(order.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
