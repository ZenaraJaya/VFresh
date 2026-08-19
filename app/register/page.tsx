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
import JobTitleField from '@/components/customer/account/JobTitleField';
import AccountSetupModal from '@/components/customer/auth/AccountSetupModal';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite')?.trim() ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [joinExisting, setJoinExisting] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [inviteCompany, setInviteCompany] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/invites/${encodeURIComponent(inviteToken)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setInviteError(data.error || 'This staff link is no longer valid.');
          return;
        }
        setInviteCompany(data.company?.name ?? 'your company');
      })
      .catch(() => setInviteError('Could not load this staff link.'));
  }, [inviteToken]);

  useEffect(() => {
    if (inviteToken || !joinExisting) return;
    fetch('/api/companies')
      .then((res) => (res.ok ? res.json() : []))
      .then(setCompanies)
      .catch(() => toast.error('Could not load companies'));
  }, [inviteToken, joinExisting]);

  const viaInvite = Boolean(inviteToken) && !inviteError && Boolean(inviteCompany);

  const canSubmit =
    Boolean(name.trim()) &&
    Boolean(email.trim()) &&
    password.length >= 8 &&
    !submitting &&
    (viaInvite || !joinExisting || Boolean(companyId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteToken && inviteError) {
      toast.error(inviteError);
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name,
        email,
        password,
        jobTitle: jobTitle.trim(),
      };
      if (inviteToken) {
        body.inviteToken = inviteToken;
      } else if (joinExisting) {
        body.companyId = companyId;
      }

      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

      toast.success('Welcome to VFresh — set payment and address');
      setSetupOpen(true);
    } catch {
      toast.error('Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    'w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950';

  return (
    <>
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
          {viaInvite ? 'Join your team' : 'Create an account'}
        </h1>
        <p className="text-sm text-neutral-500">
          {viaInvite
            ? `Register to handle orders and payments for ${inviteCompany}.`
            : 'Your personal login. Next you will set delivery address and payment. Register the company from Profile if you place office orders.'}
        </p>
      </div>

      {inviteToken && inviteError ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {inviteError}{' '}
          <Link href="/register" className="font-medium underline">
            Register without a link
          </Link>
        </p>
      ) : null}

      {viaInvite ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          Joining <span className="font-semibold">{inviteCompany}</span> as
          staff.
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="name">
          Your name
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
            className={field}
          />
        </div>
      </div>

      <JobTitleField id="jobTitle" value={jobTitle} onChange={setJobTitle} />

      {!inviteToken ? (
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={joinExisting}
            onChange={(e) => setJoinExisting(e.target.checked)}
            className="rounded border-neutral-300"
          />
          Join an approved company instead
        </label>
      ) : null}

      {!inviteToken && joinExisting ? (
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
            <option value="">Select company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
            className={field}
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

      <div className="space-y-3 pt-1 text-center text-sm">
        <p className="text-neutral-500">
          Already have an account?{' '}
          <Link
            href={`/login${searchParams.get('callbackUrl') ? `?callbackUrl=${encodeURIComponent(searchParams.get('callbackUrl')!)}` : ''}`}
            className="inline-flex min-h-11 items-center px-2 font-medium text-emerald-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="text-xs text-neutral-500">
          Kitchen or stall?{' '}
          <Link
            href="/vendor/signup"
            className="font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Vendor register
          </Link>
          {' — '}reviewed by email within 48 hours (working hours).
        </p>
      </div>
    </form>
    <AccountSetupModal
      open={setupOpen}
      defaultName={name}
      defaultEmail={email}
      onComplete={() => {
        setSetupOpen(false);
        router.push(
          safeCallbackPath(searchParams.get('callbackUrl')) ?? '/account'
        );
        router.refresh();
      }}
    />
    </>
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
