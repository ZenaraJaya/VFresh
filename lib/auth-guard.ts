import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Gate a server component behind an admin session.
 *
 * Every /admin page except the login screen calls this. The API routes repeat
 * the check independently — a page guard only hides the UI, it doesn't protect
 * the data.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return session;
}

/**
 * Gate vendor dashboard pages. Pending vendors land on /vendor/pending.
 */
export async function requireVendor() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'VENDOR') {
    redirect('/login');
  }

  if (session.user.vendorStatus && session.user.vendorStatus !== 'APPROVED') {
    redirect('/vendor/pending');
  }

  return session;
}

export async function requireCustomer(callbackUrl = '/checkout') {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CUSTOMER') {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}
