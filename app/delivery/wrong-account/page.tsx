'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Bike } from 'lucide-react';
import { homeForRole, roleLabel } from '@/lib/home-for-role';

export default function DeliveryWrongAccountPage() {
  const { data } = useSession();
  const role = data?.user?.role;
  const home = homeForRole(role, data?.user?.vendorStatus);
  const kind = roleLabel(role);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4 vf-gradient">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Bike className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">This is the rider desk</h1>
        <p className="text-sm text-neutral-500">
          You are already signed in as a {kind} account. Delivery uses a
          separate rider login — log out first, then sign in with the Delivery
          demo or your rider email.
        </p>
        {role && role !== 'DELIVERY' ? (
          <Link
            href={home}
            className="block w-full rounded-xl border border-neutral-200 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Back to {kind} home
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() =>
            signOut({ callbackUrl: '/login?callbackUrl=/delivery' })
          }
          className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-medium text-white"
        >
          Log out and use rider login
        </button>
        <Link
          href="/delivery/register"
          className="block text-sm text-emerald-700 hover:underline"
        >
          Register as delivery
        </Link>
      </div>
    </div>
  );
}
