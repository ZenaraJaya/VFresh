'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Loader2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (res?.error) {
      toast.error('Invalid email or password');
      return;
    }

    toast.success('Welcome back');
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <Leaf className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Admin sign in
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          VFresh operations dashboard
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="email"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Email
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
            placeholder="admin@vfresh.my"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 vf-gradient">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
