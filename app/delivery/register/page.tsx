'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bike, Leaf, Loader2, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/ui/PasswordInput';
import RequiredMark from '@/components/shared/ui/RequiredMark';
import PhoneInput from '@/components/shared/ui/PhoneInput';
import { safeCallbackPath } from '@/lib/safe-callback';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    Boolean(name.trim()) && Boolean(email.trim()) && password.length >= 8 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/courier/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
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
          `/login?callbackUrl=${encodeURIComponent(safeCallbackPath(searchParams.get('callbackUrl')) ?? '/delivery')}`
        );
        return;
      }
      toast.success('Welcome — you can scan orders now');
      router.push(safeCallbackPath(searchParams.get('callbackUrl')) ?? '/delivery');
      router.refresh();
    } catch {
      toast.error('Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    'w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-950';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <Bike className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          VFresh
        </p>
        <h1 className="text-2xl font-bold">Delivery register</h1>
        <p className="text-sm text-neutral-500">
          Create your rider login. Your name is shown to the kitchen and the
          customer when you pick up an order.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="courier-name">
          Your name
          <RequiredMark />
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id="courier-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="courier-phone">
          Phone
        </label>
        <PhoneInput id="courier-phone" value={phone} onChange={setPhone} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="courier-email">
          Email
          <RequiredMark />
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id="courier-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
        </div>
      </div>

      <PasswordInput
        id="courier-password"
        label="Password"
        value={password}
        onChange={setPassword}
        required
        leftIcon={<Lock className="h-4 w-4" />}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium ${
          canSubmit
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'cursor-not-allowed bg-neutral-200 text-neutral-400'
        }`}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Register
      </button>

      <p className="text-center text-sm text-neutral-500">
        Already have a rider login?{' '}
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function CourierRegisterPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 py-16 vf-gradient">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
