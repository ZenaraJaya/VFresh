'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Loader2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';

type RoleTab = 'customer' | 'vendor' | 'admin';

const DEMOS: Record<
  RoleTab,
  { label: string; email: string; password: string }
> = {
  customer: {
    label: 'Customer',
    email: 'customer@vfresh.my',
    password: 'VFreshAdmin123!',
  },
  vendor: {
    label: 'Vendor',
    email: 'vendor@vfresh.my',
    password: 'VFreshVendor123!',
  },
  admin: {
    label: 'Admin',
    email: 'admin@vfresh.my',
    password: 'VFreshAdmin123!',
  },
};

function homeForRole(role: string, vendorStatus?: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'VENDOR') {
    return vendorStatus === 'APPROVED' ? '/vendor' : '/vendor/pending';
  }
  return '/';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeDemo, setActiveDemo] = useState<RoleTab | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(email.trim()) && password.length > 0 && !submitting;

  const loginWith = async (emailValue: string, passwordValue: string) => {
    setSubmitting(true);
    const res = await signIn('credentials', {
      email: emailValue,
      password: passwordValue,
      redirect: false,
    });

    if (res?.error) {
      setSubmitting(false);
      toast.error('Invalid email or password');
      return;
    }

    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    const role = session?.user?.role as string | undefined;
    const vendorStatus = session?.user?.vendorStatus as string | undefined;
    const dest =
      searchParams.get('callbackUrl') ||
      homeForRole(role ?? 'CUSTOMER', vendorStatus);

    toast.success('Welcome back');
    router.push(dest);
    router.refresh();
    setSubmitting(false);
  };

  const fillDemo = (role: RoleTab) => {
    const demo = DEMOS[role];
    setActiveDemo(role);
    setEmail(demo.email);
    setPassword(demo.password);
    void loginWith(demo.email, demo.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWith(email, password);
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
          Sign in
        </h1>
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
            onChange={(e) => {
              setEmail(e.target.value);
              setActiveDemo(null);
            }}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={(v) => {
          setPassword(v);
          setActiveDemo(null);
        }}
        autoComplete="current-password"
        required
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
        Sign in
      </button>

      <div className="space-y-2 pt-1">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
          Demo accounts
        </p>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
          {(Object.keys(DEMOS) as RoleTab[]).map((key) => (
            <button
              key={key}
              type="button"
              disabled={submitting}
              onClick={() => fillDemo(key)}
              className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                activeDemo === key
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-neutral-950 dark:text-emerald-400'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              } disabled:opacity-60`}
            >
              {DEMOS[key].label}
            </button>
          ))}
        </div>
        {activeDemo && (
          <p className="text-center text-[11px] text-neutral-500">
            Signing in as {DEMOS[activeDemo].label}
          </p>
        )}
      </div>

      <p className="text-center text-sm text-neutral-500">
        New vendor?{' '}
        <Link
          href="/vendor/signup"
          className="font-medium text-emerald-600 hover:underline"
        >
          Register
        </Link>
        <span className="block text-xs text-neutral-400">
          Admin approves and emails your temporary password.
        </span>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-16 vf-gradient">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
