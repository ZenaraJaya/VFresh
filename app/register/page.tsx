'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Loader2, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import { safeCallbackPath } from '@/lib/safe-callback';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/companies')
      .then((res) => (res.ok ? res.json() : []))
      .then(setCompanies)
      .catch(() => toast.error('Could not load companies'));
  }, []);

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(email.trim()) &&
    Boolean(companyId) &&
    password.length >= 8 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not create account');
        return;
      }

      const login = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        toast.success('Account created — please sign in');
        router.push(
          `/login?callbackUrl=${encodeURIComponent(safeCallbackPath(searchParams.get('callbackUrl')) ?? '/account')}`
        );
        return;
      }

      toast.success('Welcome to VFresh');
      router.push(safeCallbackPath(searchParams.get('callbackUrl')) ?? '/account');
      router.refresh();
    } catch {
      toast.error('Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <Leaf className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          VFresh
        </p>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Create an account
        </h1>
        <p className="text-sm text-neutral-500">
          Pick the same company as your teammates. The first staff member who
          registers joins that account; later staff share invoices and payment
          history.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="name">
          Name
          <RequiredMark />
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="companyId">
          Company
          <RequiredMark />
        </label>
        <select
          id="companyId"
          required
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="">Join your company…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-neutral-500">
          Same company as the first teammate who registered — you will share
          invoices.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="email">
          Email
          <RequiredMark />
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
      </div>

      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        required
        showRule
        leftIcon={<Lock className="h-4 w-4" />}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition ${
          canSubmit
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
        }`}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Register
      </button>

      <p className="text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link
          href={`/login${searchParams.get('callbackUrl') ? `?callbackUrl=${encodeURIComponent(searchParams.get('callbackUrl')!)}` : ''}`}
          className="font-medium text-emerald-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
      <p className="text-center text-sm text-neutral-500">
        Kitchen?{' '}
        <Link
          href="/vendor/signup"
          className="font-medium text-emerald-600 hover:underline"
        >
          Vendor register
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-16 vf-gradient">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
