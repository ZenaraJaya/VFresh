import CompanyDetail from '@/components/admin/companies/CompanyDetail';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminCompanyDetailPage() {
  await requireAdmin();
  return <CompanyDetail />;
}
