import AdminProfileForm from '@/components/admin/account/AdminProfileForm';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminProfilePage() {
  await requireAdmin();
  return <AdminProfileForm />;
}
