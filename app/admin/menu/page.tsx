import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminMenuRedirect() {
  await requireAdmin();
  redirect('/admin/vendors/menu');
}
