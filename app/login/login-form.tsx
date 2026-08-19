'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Leaf, Loader2, Lock, Mail, ShoppingBag, Store, Bike } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import { DEMO_ACCOUNTS, isCustomerDemoEmail, type DemoRole } from '@/lib/demo-accounts';
import { safeCallbackPath } from '@/lib/safe-callback';
import { homeForRole } from '@/lib/home-for-role';

type RoleTab = DemoRole;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeDemo, setActiveDemo] = useState<RoleTab | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const canSubmit = Boolean(email.trim()) && password.length > 0 && !submitting;
  const forDelivery = (searchParams.get('callbackUrl') || '').startsWith(
    '/delivery'
  );

  const loginWith = async (emailValue: string, passwordValue: string) => {
    setSubmitting(true);
    setNotice(null);
    if (isCustomerDemoEmail(emailValue)) {
      setSubmitting(false);
      toast.error(
        'The customer demo cannot sign in. Register with your own email.'
      );
      return;
    }
    const res = await signIn('credentials', {
      email: emailValue,
      password: passwordValue,
      redirect: false,
    });

    if (res?.error) {
      const hintRes = await fetch('/api/auth/login-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });
      const hint = await hintRes.json().catch(() => ({ status: 'invalid' }));
      setSubmitting(false);
      if (hint.status === 'pending_review') {
        setNotice(
          'Your registration is still in review. You will get a response within 48 hours (working hours) via email. Thank you for your patience.'
        );
        return;
      }
      if (hint.status === 'rejected') {
        setNotice(
          'This registration was not approved. Please check your email for details.'
        );
        return;
      }
      if (hint.status === 'suspended') {
        setNotice('This vendor account is suspended. Email VFresh admin to appeal — you cannot register again.');
        return;
      }
      if (hint.status === 'customer_demo_disabled') {
        toast.error(
          'The customer demo cannot sign in. Register with your own email.'
        );
        return;
      }
      if (hint.status === 'unknown') {
        toast.error(
          'No account for this email yet. Register first — customers, kitchens, and riders each have their own signup.'
        );
        return;
      }
      toast.error(
        'Incorrect email or password. You can register first if you do not have an account yet.'
      );
      return;
    }

    const sessionRes = await fetch('/api/auth/session');
    const session = await sessionRes.json();
    const role = session?.user?.role as string | undefined;
    const vendorStatus = session?.user?.vendorStatus as string | undefined;

    if (role === 'VENDOR' && vendorStatus !== 'APPROVED') {
      setSubmitting(false);
      setNotice(
        'Your registration is still in review. You will get a response within 48 hours (working hours) via email. Thank you for your patience.'
      );
      router.push('/vendor/pending');
      return;
    }

    const callback = safeCallbackPath(searchParams.get('callbackUrl'));
    const dest =
      callback && (role === 'CUSTOMER' || role === 'DELIVERY')
        ? callback
        : homeForRole(role ?? 'CUSTOMER', vendorStatus);

    toast.success('Welcome back');
    router.push(dest);
    router.refresh();
    setSubmitting(false);
  };

  const fillDemo = (role: RoleTab) => {
    const demo = DEMO_ACCOUNTS[role];
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
      className="w-full max-w-md space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:max-w-3xl"
    >
      <div className="mx-auto w-full max-w-md space-y-5">
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
        <p className="text-sm text-neutral-500">
          {forDelivery
            ? 'Use your rider account to open the delivery desk.'
            : 'Sign in to order for your office.'}
        </p>
      </div>

      {notice ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {notice}
        </p>
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
            onChange={(e) => {
              setEmail(e.target.value);
              setActiveDemo(null);
              setNotice(null);
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
          {((Object.keys(DEMO_ACCOUNTS) as RoleTab[]).filter(
            (key) => key !== 'customer'
          )).map((key) => (
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
              {DEMO_ACCOUNTS[key].label}
            </button>
          ))}
        </div>
        {submitting && activeDemo ? (
          <p className="text-center text-[11px] text-neutral-500">
            Signing you in…
          </p>
        ) : null}
      </div>
      </div>

      <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
        <Link
          href={`/register${searchParams.get('callbackUrl') ? `?callbackUrl=${encodeURIComponent(searchParams.get('callbackUrl')!)}` : ''}`}
          className="flex h-full flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-left transition hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/40"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              New here? Create an account
            </span>
            <span className="mt-0.5 block text-xs text-neutral-600 dark:text-neutral-400">
              Personal login first. Register your company later from Profile —
              admin reviews it before you can order.
            </span>
          </span>
        </Link>
        <Link
          href="/vendor/signup"
          className="flex h-full flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-left transition hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950/40"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Store className="h-5 w-5" />
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-amber-700" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-amber-900 dark:text-amber-200">
              Sell on VFresh
            </span>
            <span className="mt-0.5 block text-xs text-neutral-600 dark:text-neutral-400">
              Kitchen or stall? Register as a vendor. We reply by email within
              48 hours (working hours).
            </span>
          </span>
        </Link>
        <Link
          href="/delivery/register"
          className="flex h-full flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-left transition hover:border-sky-300 dark:border-sky-900 dark:bg-sky-950/40"
        >
          <span className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
              <Bike className="h-5 w-5" />
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-sky-700" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-sky-800 dark:text-sky-200">
              Deliver with VFresh
            </span>
            <span className="mt-0.5 block text-xs text-neutral-600 dark:text-neutral-400">
              Rider login. Scan the order QR — kitchens and customers see your
              name.
            </span>
          </span>
        </Link>
      </div>
    </form>
  );
}
