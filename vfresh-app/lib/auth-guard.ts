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
    redirect('/admin/login');
  }

  return session;
}
