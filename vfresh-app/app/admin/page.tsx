import DashboardStats from '@/components/admin/dashboard/DashboardStats';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminDashboardPage() {
  await requireAdmin();
  return <DashboardStats />;
}
