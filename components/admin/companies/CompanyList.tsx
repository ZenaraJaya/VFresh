'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Company } from '@/types';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import PhoneInput from '@/components/shared/ui/PhoneInput';

type CompanyRow = Company & {
  _count?: { orders: number; customers: number; invites: number };
};

const EMPTY_FORM = {
  name: '',
  billingEmail: '',
  billingAddress: '',
  phone: '',
};

function whoLabel(company: CompanyRow) {
  const registrant = company.registeredBy;
  if (!registrant) return 'Opened by admin';
  return `Registered by ${registrant.name || registrant.email}${
    registrant.jobTitle ? ` · ${registrant.jobTitle}` : ''
  }`;
}

function CompanyCard({ company }: { company: CompanyRow }) {
  return (
    <Link
      href={`/admin/companies/${company.id}`}
      className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-emerald-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-800 dark:hover:bg-neutral-800"
    >
      <h2 className="font-semibold leading-tight">{company.name}</h2>
      <p className="mt-2 text-sm text-neutral-500">{whoLabel(company)}</p>
    </Link>
  );
}

export default function CompanyList() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isActive: true }),
      });
      const body = await res.json();

      if (!res.ok) {
        toast.error(body.error ?? 'Failed to create company');
        return;
      }

      toast.success('Company account created');
      setForm(EMPTY_FORM);
      setFormOpen(false);
      void fetchCompanies();
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  const pending = companies.filter((c) => c.status === 'PENDING');
  const rest = companies.filter((c) => c.status !== 'PENDING');

  const inputClass =
    'w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Companies
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Open a company to see details. Billing is under the Billing tab.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-white transition hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" />
          New account
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-700" />
          <p className="text-neutral-500 dark:text-neutral-400">
            No company accounts yet.
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                Pending review ({pending.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pending.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              All companies
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New company account</h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-neutral-800 transition hover:bg-white hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Company name
                <RequiredMark />
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="billingEmail"
                className="mb-1 block text-sm font-medium"
              >
                Billing email
                <RequiredMark />
              </label>
              <input
                id="billingEmail"
                type="email"
                required
                value={form.billingEmail}
                onChange={(e) =>
                  setForm({ ...form, billingEmail: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium">
                Phone <span className="text-neutral-400">(optional)</span>
              </label>
              <PhoneInput
                id="phone"
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone })}
              />
            </div>

            <div>
              <label
                htmlFor="billingAddress"
                className="mb-1 block text-sm font-medium"
              >
                Billing address{' '}
                <span className="text-neutral-400">(optional)</span>
              </label>
              <textarea
                id="billingAddress"
                rows={2}
                value={form.billingAddress}
                onChange={(e) =>
                  setForm({ ...form, billingAddress: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
