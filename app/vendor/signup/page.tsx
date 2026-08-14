'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import PhoneInput from '@/components/shared/ui/PhoneInput';

export default function VendorSignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    description: '',
    address: '',
    registrationNumber: '',
    premisesType: 'HOMEBASED' as 'HOMEBASED' | 'OTHER',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Could not create account');
        return;
      }

      toast.success('Submitted — awaiting admin approval');
      router.push('/vendor/pending');
    } catch {
      toast.error('Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 vf-gradient">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="space-y-1 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
            VFresh
          </p>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Vendor register
          </h1>
          <p className="text-sm text-neutral-500">
            Register your kitchen or stall. We review within 48 hours (working
            hours) and email a temporary password after approval.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business name
            <RequiredMark />
          </label>
          <input
            required
            value={form.businessName}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessName: e.target.value }))
            }
            className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="Demo Kitchen"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Email
              <RequiredMark />
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
              placeholder="kitchen@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Phone
              <RequiredMark />
            </label>
            <PhoneInput
              id="vendor-signup-phone"
              required
              value={form.phone}
              onChange={(phone) => setForm((f) => ({ ...f, phone }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Address
            <RequiredMark />
          </label>
          <input
            required
            value={form.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="Full kitchen address"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Short description
            <RequiredMark />
          </label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="Healthy bowls for office lunch…"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Premises type
            <RequiredMark />
          </label>
          <select
            required
            value={form.premisesType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                premisesType: e.target.value as 'HOMEBASED' | 'OTHER',
              }))
            }
            className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="HOMEBASED">Home-based</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Business Registration No. / SSM / ROC{' '}
            <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            value={form.registrationNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, registrationNumber: e.target.value }))
            }
            className="w-full rounded-xl border border-neutral-200 px-4 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="e.g. 202401234567"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit for approval
        </button>

        <p className="text-center text-sm text-neutral-500">
          Already approved?{' '}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
