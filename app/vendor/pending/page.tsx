import Link from 'next/link';
import { Clock, Leaf } from 'lucide-react';

export default function VendorPendingPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 vf-gradient">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Clock className="h-6 w-6" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          VFresh
        </p>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Awaiting approval
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Your registration is still in review. You will get a response within
          48 hours (working hours) via email. Thank you for your patience.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <Leaf className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
