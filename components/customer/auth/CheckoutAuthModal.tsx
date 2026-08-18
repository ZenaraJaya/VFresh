'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Leaf, Loader2, Lock, Mail, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts';
import { lockBodyScroll } from '@/lib/body-scroll-lock';

type Mode = 'login' | 'register';

const field =
  'w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950';

export default function CheckoutAuthModal({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      if (!submitting) onClose();
    };
    document.addEventListener('keydown', onKey, true);
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey, true);
      unlock();
    };
  }, [open, onClose, submitting]);

  useEffect(() => {
    if (!open) {
      setMode('login');
      setName('');
      setEmail('');
      setPassword('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open || !mounted) return null;

  const canLogin = Boolean(email.trim()) && password.length > 0 && !submitting;
  const canRegister =
    Boolean(name.trim()) &&
    Boolean(email.trim()) &&
    password.length >= 8 &&
    !submitting;

  const finish = () => {
    toast.success(mode === 'register' ? 'Welcome to VFresh' : 'Welcome back');
    onAuthenticated();
    router.push('/checkout');
    router.refresh();
  };

  const loginWith = async (emailValue: string, passwordValue: string) => {
    const res = await signIn('credentials', {
      email: emailValue,
      password: passwordValue,
      redirect: false,
    });
    if (res?.error) {
      toast.error(
        'Incorrect email or password. Register first if you do not have an account yet.'
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'register') {
        const res = await fetch('/api/customer/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || 'Could not create account');
          return;
        }
      }

      const ok = await loginWith(email, password);
      if (!ok) return;
      finish();
    } catch {
      toast.error(
        mode === 'register' ? 'Could not create account' : 'Could not sign in'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close sign in"
        disabled={submitting}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-auth-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                VFresh
              </p>
              <h2
                id="checkout-auth-title"
                className="text-lg font-semibold text-neutral-900 dark:text-white"
              >
                Sign in to continue
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-lg p-2 transition hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Please sign in to continue checkout. After you sign in, you can set
            delivery and payment.
          </p>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-neutral-950 dark:text-emerald-400'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === 'register'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-neutral-950 dark:text-emerald-400'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'register' ? (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="checkout-auth-name">
                Your name
                <RequiredMark />
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id="checkout-auth-name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={field}
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="checkout-auth-email">
              Email
              <RequiredMark />
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="checkout-auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <PasswordInput
            id="checkout-auth-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
            showRule={mode === 'register'}
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <button
            type="submit"
            disabled={mode === 'login' ? !canLogin : !canRegister}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition ${
              (mode === 'login' ? canLogin : canRegister)
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
            }`}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {mode === 'login' ? (
            <div className="space-y-2 pt-1">
              <p className="text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
                Demo account
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  const demo = DEMO_ACCOUNTS.customer;
                  setEmail(demo.email);
                  setPassword(demo.password);
                  void (async () => {
                    setSubmitting(true);
                    try {
                      const ok = await loginWith(demo.email, demo.password);
                      if (ok) finish();
                    } catch {
                      toast.error('Could not sign in');
                    } finally {
                      setSubmitting(false);
                    }
                  })();
                }}
                className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-60 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {submitting
                  ? 'Signing you in…'
                  : `Use ${DEMO_ACCOUNTS.customer.label} demo`}
              </button>
              <p className="text-center text-[11px] text-neutral-500">
                {DEMO_ACCOUNTS.customer.email}
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </div>,
    document.body
  );
}
